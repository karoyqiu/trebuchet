use std::{
  collections::HashSet,
  str::FromStr,
  sync::{LazyLock, RwLock},
};

use anyhow::anyhow;
use log::{debug, warn};
use ormlite::{
  model::{HasModelBuilder, ModelBuilder},
  Model,
};
use scopeguard::defer;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager, State};

use crate::{
  app_handle::get_app_handle,
  db::{base64::try_base64_decode, notify_change},
  error::{Error, Result},
};

use super::{endpoint::Endpoint, DbState};

static UPDATING_ONES: LazyLock<RwLock<HashSet<i64>>> =
  LazyLock::new(|| RwLock::new(HashSet::new()));

/// 订阅分组
#[derive(Debug, Deserialize, Serialize, Type, Model)]
pub struct Subscription {
  /// 订阅分组 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 名称
  pub name: String,
  /// URL
  pub url: String,
  /// 是否禁用
  pub disabled: Option<bool>,
}

impl Subscription {
  /// 更新订阅
  pub async fn update(&self) -> Result<()> {
    if self.is_updating() {
      debug!("Sub {} is already updating", self.id);
      return Ok(());
    }

    let app = get_app_handle();

    if let Some(app) = app {
      self.set_updating(&app, true);

      defer! {
        self.set_updating(&app, false);
      }

      // 下载订阅
      let body = reqwest::get(&self.url).await?.text().await?;
      debug!("String: {}", &body);

      // 尝试 base64 解码
      let body = try_base64_decode(body)?;
      debug!("Decoded: {}", &body);

      // 按行分割
      let lines = body.split("\n");

      let state: State<DbState> = app.state();
      let mut db_guard = state.db.lock().await;
      let db = db_guard.as_mut().expect("Database not intialized");

      // 删除原有的
      ormlite::query("DELETE FROM endpoint WHERE sub_id = ?")
        .bind(self.id)
        .fetch_optional(&mut *db)
        .await?;

      // 插入新的
      for line in lines {
        let line = line.trim();
        debug!("Line: {}", line);

        if line.is_empty() {
          continue;
        }

        if let Ok(ep) = Endpoint::from_str(line) {
          Endpoint::builder()
            .sub_id(self.id)
            .uri(ep.uri)
            .name(ep.name)
            .host(ep.host)
            .port(ep.port)
            .outbound(ep.outbound)
            .insert(&mut *db)
            .await?;
        } else {
          warn!("Error parse line {}", line);
        }
      }

      notify_change::<Endpoint>(&app)?;

      Ok(())
    } else {
      Err(Error::Anyhow(anyhow!("No app handle")))
    }
  }

  /// 检查是否正在更新
  fn is_updating(&self) -> bool {
    let lock = UPDATING_ONES.read().unwrap();
    lock.contains(&self.id)
  }

  /// 设置正在更新状态
  fn set_updating(&self, app: &AppHandle, updating: bool) {
    let mut lock = UPDATING_ONES.write().unwrap();

    if updating {
      debug!("Set sub {} updating", self.id);
      lock.insert(self.id);
    } else {
      debug!("Clear sub {} updating", self.id);
      lock.remove(&self.id);
    }

    app.emit_all("app://subscription/updating", ()).unwrap();
  }
}

/// 获取正在更新的订阅 ID 列表
#[tauri::command]
#[specta::specta]
pub fn db_get_updating_subscription_ids() -> Vec<i64> {
  let lock = UPDATING_ONES.read().unwrap();
  Vec::from_iter(lock.to_owned())
}
