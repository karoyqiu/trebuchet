use ormlite::Model;
use serde::Serialize;
use specta::Type;

/// 流量记录
#[derive(Clone, Debug, Serialize, Type, Model)]
pub struct Flow {
  /// 流量记录 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 时间戳，ID
  pub ts: i64,
  /// 下载速度，字节/秒
  pub download: i64,
  /// 上传速度，字节/秒
  pub upload: i64,
}
