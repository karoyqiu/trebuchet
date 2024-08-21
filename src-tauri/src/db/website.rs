use ormlite::Model;
use serde::{Deserialize, Serialize};
use specta::Type;

/// 站点
#[derive(Clone, Debug, Deserialize, Serialize, Type, Model)]
pub struct Website {
  /// 站点 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 名称
  pub name: String,
  /// URL
  pub url: String,
}
