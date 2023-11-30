// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
use std::{env, fs, net::TcpListener};

use error::{map_anything, Result};
use tauri::App;

// 下载指定 URL，并返回文本内容。
#[tauri::command]
async fn download(url: &str) -> Result<String> {
  let body = reqwest::get(url).await?.text().await?;
  Ok(body)
}

// 获取可用于侦听的 TCP 端口。
#[tauri::command]
fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}

/// 如果指定的资源文件在目标目录中不存在，则复制一份。
fn copy_resource_if_not_exists(app: &App, filename: &str) -> Result<()> {
  let resolver = app.path_resolver();

  if let Some(mut dest) = resolver.app_data_dir() {
    dest.push(filename);

    if dest.exists() {
      // 文件存在
      return Ok(());
    }

    // 文件不存在
    let filename = String::from("xray/") + filename;

    if let Some(src) = resolver.resolve_resource(filename) {
      let copied = fs::copy(src, dest)?;

      if copied > 0 {
        return Ok(());
      }
    }
  }

  Err(map_anything("App data dir or source file does not exist."))
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // 清空临时目录
      let mut temp = env::temp_dir();
      temp.push(&app.package_info().name);
      let _ = fs::remove_dir_all(&temp);
      fs::create_dir_all(&temp)?;

      // 创建数据目录，并复制文件
      if let Some(data_dir) = app.path_resolver().app_data_dir() {
        fs::create_dir_all(&data_dir)?;
        copy_resource_if_not_exists(app, "geoip.dat")?;
        copy_resource_if_not_exists(app, "geosite.dat")?;
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![download, get_available_port])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
