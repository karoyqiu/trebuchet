use std::net::TcpListener;

use tauri::AppHandle;

use crate::{
  app_handle::get_app_handle,
  error::{map_any_error, map_anything, Result},
};

pub mod endpoint;
pub mod query_stats;
pub mod subscription;

/// 获取可用于侦听的 TCP 端口
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}

/// 下载资源文件，并保存到应用数据目录。
async fn download_resource(app: &AppHandle, url: &str, filename: &str) -> Result<()> {
  if let Some(mut dir) = app.path_resolver().app_data_dir() {
    dir.push(filename);
    let body = reqwest::get(url).await?.bytes().await?;
    tokio::fs::write(dir, body).await.map_err(map_any_error)
  } else {
    Err(map_anything("No app data dir"))
  }
}

/// 更新 geoip.dat & geosite.dat
pub async fn update_geosites() {
  if let Some(app) = get_app_handle() {
    let geoip = download_resource(
      &app,
      "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat",
      "geoip.dat",
    );
    let geosite = download_resource(
      &app,
      "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat",
      "geosite.dat",
    );

    let _ = geoip.await;
    let _ = geosite.await;
  }
}
