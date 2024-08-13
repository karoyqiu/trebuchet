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
  /// 加密方式
  pub cipher: Option<String>,
  /// 传输协议
  pub transport: Option<String>,
  /// 延迟，毫秒；-1 表示正在测试
  pub latency: Option<i32>,
  /// 速度，字节/秒
  pub speed: Option<i64>,
  /// 今日上传流量，字节
  pub upload: Option<i64>,
  /// 今日下载流量，字节
  pub download: Option<i64>,
  /// 总上传流量，字节
  pub total_upload: Option<i64>,
  /// 总下载流量，字节
  pub total_download: Option<i64>,
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
  #[error("unknown parse endpoint error")]
  Unknown,
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
    let uri = &uri[8..];
    let params = BASE64_STANDARD.decode(uri)?;
    let params: VMessParams = serde_json::from_slice(&params)?;

    Ok(Endpoint {
      id: 0,
      sub_id: 0,
      uri: String::from(uri),
      name: params.ps,
      host: params.add,
      port: params.port.parse::<u16>()?,
      cipher: params.scy,
      transport: params.net,
      latency: None,
      speed: None,
      upload: None,
      download: None,
      total_upload: None,
      total_download: None,
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
      cipher: None,
      transport: None,
      latency: None,
      speed: None,
      upload: None,
      download: None,
      total_upload: None,
      total_download: None,
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
