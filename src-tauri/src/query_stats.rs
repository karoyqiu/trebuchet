use crate::error::Result;
use serde::{Deserialize, Serialize};
use tauri::api::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct XrayStats {
  total_download: u64,
  total_upload: u64,
}

#[derive(Deserialize)]
struct StatItem {
  name: String,
  value: String,
}

#[derive(Deserialize)]
struct StatObject {
  stat: Vec<StatItem>,
}

#[derive(Serialize, Deserialize)]
pub struct SysObject {
  #[serde(rename(deserialize = "Uptime"))]
  uptime: u64,
}

#[tauri::command]
pub async fn query_stats(api_port: u16) -> Result<XrayStats> {
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

  for stat in obj.stat.iter() {
    match stat.name.as_str() {
      "outbound>>>proxy>>>traffic>>>uplink" => {
        stats.total_upload = stat.value.parse().unwrap_or_default();
      }
      "outbound>>>proxy>>>traffic>>>downlink" => {
        stats.total_download = stat.value.parse().unwrap_or_default();
      }
      _ => {}
    }
  }

  Ok(stats)
}

#[tauri::command]
pub async fn query_sys(api_port: u16) -> Result<SysObject> {
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
