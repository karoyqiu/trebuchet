use ormlite::{types::Json, Model};
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
  /// SOCKS 侦听端口
  pub socks_port: u16,
  /// HTTP 侦听端口
  pub http_port: u16,
  /// 是否允许局域网连接
  pub allow_lan: bool,
  /// 订阅自动更新间隔，分钟
  pub sub_update_interval: u32,
  /// 节点自动测速间隔，分钟
  pub ep_test_interval: u32,
  /// 节点测速并发量
  pub ep_test_concurrency: u32,
  /// 测试用 URL
  pub ep_test_url: String,
  /// 路由规则
  pub rule: String,
}

#[derive(Debug, Deserialize, Serialize, Model)]
pub struct SettingsTable {
  #[ormlite(primary_key)]
  pub id: i64,
  pub settings: Json<Settings>,
}
