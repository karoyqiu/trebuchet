use std::str::FromStr;

use base64::prelude::{Engine, BASE64_STANDARD};
use ormlite::Model;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
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
  /// 出站对象
  pub outbound: String,
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
struct VMessParams {
  //v: String,
  ps: String,
  add: String,
  port: String,
  //#[serde(rename = "type")]
  //type_: String,
  id: String,
  //aid: String,
  net: Option<String>,
  path: String,
  host: String,
  tls: String,
  sni: Option<String>,
  alpn: Option<String>,
  fp: Option<String>,
  scy: Option<String>,
}

impl VMessParams {
  pub fn to_stream_settings(&self) -> Value {
    let (security, tls_settings) = if !self.tls.is_empty() {
      (
        "tls",
        Some(json!({
          "serverName": self.sni,
          "alpn": self.alpn,
          "fingerprint": self.fp,
        })),
      )
    } else {
      ("none", None)
    };

    json!({
      "security": security,
      "tlsSettings": tls_settings,
      "network": self.net,
      "httpSettings": {
        "host":[self.host],
        "path": self.path,
      },
      "wsSettings": {
        "headers": {
          "host": self.host,
        },
        "path": self.path,
      }
    })
  }
}

impl Endpoint {
  /// 从 vmess URI 构建节点结构
  fn from_vmess(uri: &str) -> Result<Self, ParseEndpointError> {
    let full = String::from(uri);
    let uri = &uri[8..];
    let params = BASE64_STANDARD.decode(uri)?;
    let params: VMessParams = serde_json::from_slice(&params)?;
    let outbound = json!({
      "tag": "proxy",
      "protocol": "vmess",
      "settings": {
        "vnext": [{
          "address": params.add,
          "port": params.port.parse::<u16>()?,
          "users": [{
            "id": params.id,
            "security": params.scy,
          }]
        }]
      },
      "streamSettings": params.to_stream_settings(),
    });

    Ok(Endpoint {
      id: 0,
      sub_id: 0,
      uri: full,
      name: params.ps,
      host: params.add,
      port: params.port.parse::<u16>()?,
      latency: None,
      outbound: outbound.to_string(),
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
      outbound: String::default(),
    })
  }

  /// 从 trojan URI 构建节点结构
  fn from_trojan(s: &str, uri: &URI) -> Result<Self, ParseEndpointError> {
    let mut ep = Self::from_others(s, uri)?;
    let outbound = json!({
      "tag": "proxy",
      "protocol": "trojan",
      "settings": {
        "servers": [{
          "address": ep.host,
          "port": ep.port,
          "password": to_userinfo(uri),
        }]
      },
      "streamSettings": uri_to_stream_settings(uri),
    });

    ep.outbound = outbound.to_string();
    Ok(ep)
  }

  /// 从 vless URI 构建节点结构
  fn from_vless(s: &str, uri: &URI) -> Result<Self, ParseEndpointError> {
    let mut ep = Self::from_others(s, uri)?;
    let params = uri.query.clone().unwrap_or_default();
    let outbound = json!({
      "tag": "proxy",
      "protocol": "vless",
      "settings": {
        "vnext": [{
          "address": ep.host,
          "port": ep.port,
          "users": [{
            "id": to_userinfo(uri),
            "encryption": "none",
            "flow": params.get("flow").unwrap_or(&&""),
          }]
        }]
      },
      "streamSettings": uri_to_stream_settings(uri),
    });

    ep.outbound = outbound.to_string();
    Ok(ep)
  }

  /// 从 ss URI 构建节点结构
  fn from_ss(s: &str, uri: &URI) -> Result<Self, ParseEndpointError> {
    let mut ep = Self::from_others(s, uri)?;
    let userinfo = to_userinfo(uri);
    let userinfo = if userinfo.contains(":") {
      userinfo
    } else {
      let v8 = BASE64_STANDARD.decode(userinfo)?;
      String::from_utf8(v8)?
    };
    let pos = userinfo.find(":").unwrap_or_default();
    let method = &userinfo[0..pos];
    let password = &userinfo[pos + 1..];

    let outbound = json!({
      "tag": "proxy",
      "protocol": "shadowsocks",
      "settings": {
        "servers": [{
          "method": method,
          "address": ep.host,
          "port": ep.port,
          "password": password,
        }]
      },
    });

    ep.outbound = outbound.to_string();
    Ok(ep)
  }
}

impl FromStr for Endpoint {
  type Err = ParseEndpointError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let uri = parse_uri(s)?;

    match uri.scheme {
      "vmess" => Self::from_vmess(s),
      "trojan" => Self::from_trojan(s, &uri),
      "vless" => Self::from_vless(s, &uri),
      "ss" => Self::from_ss(s, &uri),
      _ => Err(ParseEndpointError::UnsupportedProtocol),
    }
  }
}

fn uri_to_stream_settings(uri: &URI) -> Value {
  let params = uri.query.clone().unwrap_or_default();
  let network = params.get("type").unwrap_or(&&"tcp");
  let mut sso = json!({
    "network": *network,
  });

  let header_type = params.get("headerType").unwrap_or(&&"none");
  let host = params.get("host").unwrap_or(&&"");
  let security = params.get("security").unwrap_or(&&"");
  let alpn = if let Some(alpn) = params.get("alpn") {
    Some(json!([*alpn]))
  } else {
    None
  };

  let settings = match *network {
    "tcp" => {
      if *header_type == "http" {
        json!({
          "tcpSettings": {
            "header": {
              "type": "http",
              "request": { "headers": { "host": [*host] } },
              "response": {},
            }
          }
        })
      } else {
        json!({
          "tcpSettings": {
            "header": {
              "type": "none",
            }
          }
        })
      }
    }

    "kcp" => json!({
      "kcpSettings": {
        "header": { "type": *header_type },
        "seed": params.get("seed").unwrap_or(&&""),
      }
    }),

    "ws" => json!({
      "wsSettings": {
        "headers": { "host": host },
        "path": params.get("path").unwrap_or(&&"/"),
      }
    }),

    "http" | "h2" => json!({
      "httpSettings": {
        "host": [host],
        "path": params.get("path").unwrap_or(&&"/"),
      }
    }),

    "quic" => json!({
      "quicSettings": {
        "security": params.get("quicSecurity").unwrap_or(&&"none"),
        "header": { "type": *header_type },
        "key": params.get("key").unwrap_or(&&""),
      }
    }),

    "grpc" => json!({
      "grpcSettings": {
        "serviceName": params.get("serviceName").unwrap_or(&&""),
      }
    }),

    _ => json!({}),
  };

  let security = match *security {
    "tls" => json!({
      "security": "tls",
      "tlsSettings": {
        "serverName": params.get("sni").unwrap_or(&uri.host.unwrap()),
        "alpn": alpn,
        "fingerprint": params.get("fp").map(|v| *v),
      }
    }),

    "reality" => json!({
      "security": "reality",
      "realitySettings": {
        "serverName": params.get("sni").unwrap_or(&&""),
        "fingerprint": params.get("fp").unwrap_or(&&""),
        "publicKey": params.get("pbk").unwrap_or(&&""),
        "shortID": params.get("sid").unwrap_or(&&""),
        "spiderX": params.get("spiderX").unwrap_or(&&""),
      }
    }),

    _ => json!({ "security": "none" }),
  };

  json_merge(&mut sso, settings);
  json_merge(&mut sso, security);
  sso
}

/// 将第二个对象合并入第一个对象
fn json_merge(a: &mut Value, b: Value) {
  match (a, b) {
    (Value::Object(a), Value::Object(b)) => {
      for (k, v) in b {
        json_merge(a.entry(k).or_insert(Value::Null), v);
      }
    }

    (a, b) => *a = b,
  }
}

fn to_userinfo(uri: &URI) -> String {
  if let Some(user) = &uri.user {
    if let Some(password) = user.password {
      format!("{}:{}", user.name, password)
    } else {
      String::from(user.name)
    }
  } else {
    String::default()
  }
}
