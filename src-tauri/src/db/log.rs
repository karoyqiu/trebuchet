use ormlite::Model;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Xray 日志
#[derive(Clone, Debug, Deserialize, Serialize, Type, Model)]
#[serde(rename_all = "camelCase")]
pub struct Log {
  /// 节点 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 日志
  pub log: String,
}
