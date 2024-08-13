use std::{
  collections::HashSet,
  sync::{LazyLock, RwLock},
};

use log::debug;
use ormlite::Model;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::error::Result;

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

    self.set_updating(true);

    self.set_updating(false);
    Ok(())
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
