use ormlite::Model;
use serde::{Deserialize, Serialize};
use specta::Type;

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
