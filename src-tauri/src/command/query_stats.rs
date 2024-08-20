use crate::{app_handle::get_app_handle, error::Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{api::process::Command, async_runtime::spawn, Manager};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct XrayStats {
  total_download: u64,
  total_upload: u64,
}

#[derive(Debug, Deserialize)]
struct StatItem {
  name: String,
  value: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StatObject {
  stat: Vec<StatItem>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SysObject {
  #[serde(rename(deserialize = "Uptime"))]
  uptime: u64,
}

#[derive(Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AllStats {
  total_download: u64,
  total_upload: u64,
  uptime: u64,
}

async fn query_stats(api_port: u16) -> Result<XrayStats> {
  let output = Command::new_sidecar("xray")?
    .args([
      "api",
      "statsquery",
      &format!("--server=127.0.0.1:{}", api_port),
    ])
    .output()?;
  let obj: StatObject = serde_json::from_str(&output.stdout)?;

  let mut stats = XrayStats {
    total_download: 0,
    total_upload: 0,
  };

  for stat in obj.stat {
    match stat.name.as_str() {
      "outbound>>>proxy>>>traffic>>>uplink" => {
        stats.total_upload = stat.value.unwrap_or_default().parse().unwrap_or_default();
      }
      "outbound>>>proxy>>>traffic>>>downlink" => {
        stats.total_download = stat.value.unwrap_or_default().parse().unwrap_or_default();
      }
      _ => {}
    }
  }

  Ok(stats)
}

async fn query_sys(api_port: u16) -> Result<SysObject> {
  let output = Command::new_sidecar("xray")?
    .args([
      "api",
      "statssys",
      &format!("--server=127.0.0.1:{}", api_port),
    ])
    .output()?;

  let obj: SysObject = serde_json::from_str(&output.stdout)?;
  Ok(obj)
}

/// 查询所有数据并上报
pub(crate) async fn query_all_stats(api_port: u16) -> Result<()> {
  if let Some(app) = get_app_handle() {
    let stats = spawn(query_stats(api_port));
    let sys = spawn(query_sys(api_port));

    let stats = stats.await??;
    let sys = sys.await??;

    app.emit_all(
      "app://stats",
      AllStats {
        total_download: stats.total_download,
        total_upload: stats.total_upload,
        uptime: sys.uptime,
      },
    )?;
  }

  Ok(())
}
