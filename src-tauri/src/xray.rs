use std::{collections::HashMap, path::PathBuf};

use anyhow::anyhow;
use log::{debug, info, warn};
use serde_json::{json, Value};
use tauri::{
  api::process::{Command, CommandChild, CommandEvent, Encoding},
  AppHandle,
};
use tokio::sync::mpsc::Receiver;

use crate::{
  app_handle::get_app_handle,
  command::get_available_port,
  db::{endpoint::Endpoint, get_settings, insert_log},
  error::{Error, Result},
};

/// Xray 命令
pub struct Xray {
  /// 节点
  ep: Endpoint,
  /// 配置文件全路径
  filename: Option<String>,
  /// xray 命令
  child: Option<CommandChild>,
  rx: Option<Receiver<CommandEvent>>,
  /// 监听端口
  port: Option<u16>,
}

impl Xray {
  /// 创建新的 Xray 命令
  pub fn new(endpoint: Endpoint) -> Self {
    Xray {
      ep: endpoint,
      filename: None,
      child: None,
      rx: None,
      port: None,
    }
  }

  /// 节点
  pub fn endpoint(&self) -> &Endpoint {
    &self.ep
  }

  /// 监听端口
  pub fn port(&self) -> Option<u16> {
    self.port
  }

  /// 启动 xray
  pub async fn start(&mut self, rule: &str) -> Result<()> {
    if self.child.is_some() {
      warn!("Xray for {} is already started", self.ep.name);
      return Ok(());
    }

    if let Some(app) = get_app_handle() {
      let resolver = app.path_resolver();
      let data_dir = resolver.app_data_dir().unwrap();
      let mut fullpath = resolver.app_config_dir().unwrap();
      fullpath.push("config");
      fullpath.push(format!("{}.json", self.ep.id));
      let filename = fullpath.clone().into_os_string().into_string().unwrap();

      self.save_config_file(rule, &fullpath).await?;

      // 启动 xray
      let cmd = Command::new_sidecar("xray")?
        .args(["-config", filename.as_str()])
        .envs(HashMap::from([(
          String::from("XRAY_LOCATION_ASSET"),
          data_dir.into_os_string().into_string().unwrap(),
        )]))
        .encoding(Encoding::for_label(b"utf-8").unwrap());

      let (rx, child) = cmd.spawn()?;
      let log = format!("[{}] Xray started for {}", child.pid(), self.ep.name);
      info!("{}", &log);
      insert_log(&app, log).await?;

      self.filename = Some(filename);
      self.child = Some(child);
      self.rx = Some(rx);

      Ok(())
    } else {
      Err(Error::Anyhow(anyhow!("No app handle")))
    }
  }

  /// 停止 xray
  pub async fn stop(&mut self) -> Result<()> {
    if let Some(mut rx) = self.rx.take() {
      rx.close();
    }

    if let Some(child) = self.child.take() {
      child.kill()?;
      let _ = tokio::fs::remove_file(self.filename.take().unwrap()).await;
    }

    self.port = None;
    self.filename = None;

    Ok(())
  }

  /// 等待进程运行
  pub async fn wait_for_started(&mut self) -> Result<()> {
    let pid = if let Some(child) = &self.child {
      child.pid()
    } else {
      0
    };

    if let Some(mut rx) = self.rx.take() {
      while let Some(event) = rx.recv().await {
        let app = get_app_handle();

        if send_event(&app, pid, event).await? {
          tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
              send_event(&app, pid, event).await.unwrap();
            }

            rx.close();
          });

          return Ok(());
        }
      }

      debug!("No more messages?");
    }

    Err(Error::Anyhow(anyhow!("No rx")))
  }

  /// 将配置保存为文件
  async fn save_config_file(&mut self, rule: &str, filename: &PathBuf) -> Result<()> {
    // 入站配置
    let (inbounds, port) = get_inbound_objects(rule == "test").await?;
    self.port = Some(port);

    // 出站配置
    let outbound: Value = serde_json::from_str(self.ep.outbound.as_str())?;
    let outbounds = vec![
      json!({
        "tag": "direct",
        "protocol": "freedom",
      }),
      json!({
        "tag": "block",
        "protocol": "blackhole",
        "settings": {
          "response": {
            "type": "http"
          }
        }
      }),
      outbound,
    ];

    // 路由规则
    let mut rules = Vec::new();

    match rule {
      // 默认路由规则
      "default" => {
        rules.push(json!({
          "type": "field",
          "outboundTag": "block",
          "domain": [
            "activity.meteor.com",
            "geosite:category-ads-all",
          ]
        }));
        rules.push(json!({
          "type": "field",
          "outboundTag": "direct",
          "domain": [
            "domain:cypress.io",
            "geosite:cn",
            "geosite:private",
            "geosite:apple-cn",
            "geosite:google-cn",
            "geosite:tld-cn",
            "geosite:category-games@cn",
          ],
        }));
        rules.push(json!({
          "type": "field",
          "outboundTag": "direct",
          "ip": [
            "8.8.8.8/32",
            "223.5.5.5/32",
            "119.29.29.29/32",
            "180.76.76.76/32",
            "114.114.114.114/32",
            "geoip:private",
            "geoip:cn",
          ],
        }));
      }

      // 代理全部数据
      "all" => {
        rules.push(json!({
          "type": "field",
          "outboundTag": "direct",
          "domain": [
            "domain:cypress.io",
            "geosite:private",
          ],
        }));
        rules.push(json!({
          "type": "field",
          "outboundTag": "direct",
          "ip": [
            "8.8.8.8/32",
            "223.5.5.5/32",
            "119.29.29.29/32",
            "180.76.76.76/32",
            "114.114.114.114/32",
            "geoip:private",
          ],
        }));
      }

      // 测试不加任何规则
      _ => {}
    }

    rules.push(json!({
      "type": "field",
      "port": "0-65535",
      "outboundTag": "proxy",
    }));

    let api = if rule == "test" {
      json!({
        "tag": "api",
        "services": [
          "StatsService"
        ]
      })
    } else {
      json!({
        "tag": "api",
        "listen": format!("127.0.0.1:{}", port),
        "services": [
          "StatsService"
        ]
      })
    };

    let config = json!({
      "api": api,
      "dns": {
        "hosts": {
          "dns.google": "8.8.8.8",
          "dns.pub": "119.29.29.29",
          "dns.alidns.com": "223.5.5.5",
          "geosite:category-ads-all": "127.0.0.1"
        },
        "servers": [
          {
            "address": "https://1.1.1.1/dns-query",
            "domains": [
              "geosite:geolocation-!cn"
            ],
            "expectIPs": [
              "geoip:!cn"
            ]
          },
          "8.8.8.8",
          {
            "address": "223.5.5.5",
            "port": 53,
            "domains": [
              "geosite:cn",
              "geosite:category-games@cn"
            ],
            "expectIPs": [
              "geoip:cn"
            ],
            "skipFallback": true
          },
          {
            "address": "localhost",
            "skipFallback": true
          }
        ]
      },
      "log": {
        "access": "",
        "error": "",
        "loglevel": "warning"
      },
      "policy": {
        "system": {
          "statsOutboundDownlink": true,
          "statsOutboundUplink": true
        }
      },
      "routing": {
        "domainStrategy": "AsIs",
        "rules": rules,
      },
      "stats": {},
      "inbounds": inbounds,
      "outbounds": outbounds,
    });

    // 保存文件
    tokio::fs::write(filename, config.to_string()).await?;
    Ok(())
  }
}

// impl Drop for Xray {
//   fn drop(&mut self) {
//     if self.child.is_some() {
//       let _ = tauri::async_runtime::block_on(self.stop());
//     }
//   }
// }

/// 获取入站配置
async fn get_inbound_objects(for_test: bool) -> Result<(Vec<Value>, u16)> {
  let mut inbounds = Vec::new();
  let port = get_available_port()?;

  if for_test {
    // 测试用，只有 socks 入站
    inbounds.push(json!({
      "tag": "socks",
      "port": port,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"],
        "routeOnly": false,
      },
      "settings": {
        "auth": "noauth",
        "udp": true,
      },
    }));
  } else {
    // 正常用，生成 socks、http 和 API 入站
    // 用户配置
    let app = get_app_handle().unwrap();
    let settings = get_settings(&app).await?;
    let listen = if settings.allow_lan {
      "0.0.0.0"
    } else {
      "127.0.0.1"
    };

    // socks
    inbounds.push(json!({
      "tag": "socks",
      "port": settings.socks_port,
      "listen":  listen,
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"],
        "routeOnly": false,
      },
      "settings": {
        "auth": "noauth",
        "udp": true,
      },
    }));

    // http
    inbounds.push(json!({
      "tag": "http",
      "port": settings.http_port,
      "listen":  listen,
      "protocol": "http",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"],
        "routeOnly": false,
      },
      "settings": {
        "allowTransparent": false,
      },
    }));
  }

  Ok((inbounds, port))
}

async fn send_event(app: &Option<AppHandle>, pid: u32, event: CommandEvent) -> Result<bool> {
  if let Some(ref app) = app {
    match event {
      CommandEvent::Stderr(line) | CommandEvent::Stdout(line) | CommandEvent::Error(line) => {
        let line = format!("[{}] {}", pid, line.trim());
        let started = line.contains("Xray") && line.contains("started");

        insert_log(app, line).await?;

        return Ok(started);
      }

      CommandEvent::Terminated(payload) => {
        let line = format!(
          "[{}] Xray terminated with code {}",
          pid,
          payload.code.unwrap_or(-1)
        );
        info!("{}", &line);
        insert_log(app, line).await?;
      }

      _ => {}
    }
  }

  Ok(false)
}
