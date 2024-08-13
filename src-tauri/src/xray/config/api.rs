use serde::{Deserialize, Serialize};
use specta::Type;

/// API 接口配置
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct ApiObject {
  /// 出站代理标识。
  pub tag: Option<String>,
  /// API 服务监听的 IP 和端口
  pub listen: Option<String>,
  /// 开启的 API 列表
  pub services: Option<Vec<String>>,
}
