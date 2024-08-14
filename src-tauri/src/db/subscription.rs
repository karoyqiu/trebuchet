use std::{
  collections::HashSet,
  str::FromStr,
  sync::{LazyLock, RwLock},
};

use anyhow::anyhow;
use base64::{prelude::BASE64_STANDARD, Engine};
use log::debug;
use ormlite::{
  model::{HasModelBuilder, ModelBuilder},
  Model,
};
use scopeguard::defer;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{Manager, State};

use crate::{
  app_handle::get_app_handle,
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
      self.set_updating(true);

      defer! {
        self.set_updating(false);
      }

      // 下载订阅
      let body = reqwest::get(&self.url).await?.text().await?;
      // base64 解码
      let body = BASE64_STANDARD.decode(body)?;
      let body = String::from_utf8(body)?;

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

        if line.is_empty() {
          continue;
        }

        let ep = Endpoint::from_str(line)?;
        Endpoint::builder()
          .sub_id(self.id)
          .uri(ep.uri)
          .name(ep.name)
          .host(ep.host)
          .port(ep.port)
          .insert(&mut *db)
          .await?;
      }

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
  fn set_updating(&self, updating: bool) {
    let mut lock = UPDATING_ONES.write().unwrap();

    if updating {
      debug!("Set sub {} updating", self.id);
      lock.insert(self.id);
    } else {
      debug!("Clear sub {} updating", self.id);
      lock.remove(&self.id);
    }
  }
}
