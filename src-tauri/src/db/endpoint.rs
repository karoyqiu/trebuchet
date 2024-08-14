use std::str::FromStr;

use base64::prelude::{Engine, BASE64_STANDARD};
use ormlite::Model;
use serde::{Deserialize, Serialize};
use specta::Type;
use thiserror::Error;
use uri_parser::{parse_uri, URI};

/// 节点
#[derive(Debug, Deserialize, Serialize, Type, Model)]
#[serde(rename_all = "camelCase")]
pub struct Endpoint {
  /// 节点 ID
  #[ormlite(primary_key)]
  pub id: i64,
  /// 订阅分组 ID
  pub sub_id: i64,
  /// URI
  pub uri: String,
  /// 名称
  pub name: String,
  /// 地址
  pub host: String,
  /// 端口
  pub port: u16,
  /// 延迟，毫秒；-1 表示正在测试
  pub latency: Option<i32>,
}

#[derive(Debug, Error)]
pub enum ParseEndpointError {
  #[error("invalid URI")]
  InvalidUri(#[from] uri_parser::Error),
  #[error("failed to decode base64")]
  Base64DecodeError(#[from] base64::DecodeError),
  #[error("failed to parse JSON")]
  JsonError(#[from] serde_json::Error),
  #[error("failed to parse integer")]
  ParseIntError(#[from] std::num::ParseIntError),
  #[error("unsupported protocol")]
  UnsupportedProtocol,
  #[error("utf8 error")]
  FromUtf8Error(#[from] std::string::FromUtf8Error),
}

/// VMess 协议参数
#[derive(Debug, Deserialize)]
pub struct VMessParams {
  v: String,
  ps: String,
  add: String,
  port: String,
  #[serde(rename = "type")]
  type_: String,
  id: String,
  aid: String,
  net: Option<String>,
  path: String,
  host: String,
  tls: String,
  sni: Option<String>,
  alpn: Option<String>,
  fp: Option<String>,
  scy: Option<String>,
}

impl Endpoint {
  /// 从 vmess URI 构建节点结构
  fn from_vmess(uri: &str) -> Result<Self, ParseEndpointError> {
    let full = String::from(uri);
    let uri = &uri[8..];
    let params = BASE64_STANDARD.decode(uri)?;
    let params: VMessParams = serde_json::from_slice(&params)?;

    Ok(Endpoint {
      id: 0,
      sub_id: 0,
      uri: full,
      name: params.ps,
      host: params.add,
      port: params.port.parse::<u16>()?,
      latency: None,
    })
  }

  /// 从 trojan、vless 或 ss URI 构建节点结构
  fn from_others(s: &str, uri: &URI) -> Result<Self, ParseEndpointError> {
    Ok(Endpoint {
      id: 0,
      sub_id: 0,
      uri: String::from(s),
      name: urlencoding::decode(uri.hash.unwrap_or_default())?.into(),
      host: String::from(uri.host.unwrap_or_default()),
      port: uri.port.unwrap_or_default(),
      latency: None,
    })
  }
}

impl FromStr for Endpoint {
  type Err = ParseEndpointError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let uri = parse_uri(s)?;

    match uri.scheme {
      "vmess" => Self::from_vmess(s),
      "trojan" | "ss" | "vless" => Self::from_others(s, &uri),
      _ => Err(ParseEndpointError::UnsupportedProtocol),
    }
  }
}
