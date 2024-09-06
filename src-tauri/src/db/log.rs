use ormlite::Model;
use serde::Serialize;
use specta::Type;

/// Xray 日志
#[derive(Clone, Debug, Serialize, Type, Model)]
pub struct Log {
  /// 日志 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 日志
  pub log: String,
}
