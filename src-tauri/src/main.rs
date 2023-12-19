// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
use std::{
  fs,
  net::TcpListener,
  time::{Duration, Instant},
};

use error::{map_any_error, map_anything, Result};
use tauri::{
  App, AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
  SystemTrayMenuItem, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

#[derive(Clone, serde::Serialize)]
struct Payload {
  args: Vec<String>,
  cwd: String,
}

/// 下载指定 URL，并返回文本内容。
#[tauri::command]
async fn download(url: &str) -> Result<String> {
  let body = reqwest::get(url).await?.text().await?;
  Ok(body)
}

/// 下载资源文件，并保存到应用数据目录。
#[tauri::command]
async fn download_resource(app: AppHandle, url: &str, filename: &str) -> Result<()> {
  if let Some(mut dir) = app.path_resolver().app_data_dir() {
    dir.push(filename);
    let body = reqwest::get(url).await?.bytes().await?;
    tokio::fs::write(dir, body).await.map_err(map_any_error)
  } else {
    Err(map_anything("No app data dir"))
  }
}

/// 获取可用于侦听的 TCP 端口。
#[tauri::command]
fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}

/// 测试指定代理的延迟，结果为毫秒。
#[tauri::command]
async fn test_latency(proxy_port: u16, timeout: Option<u64>) -> Result<i32> {
  let proxy_url = format!("socks5://127.0.0.1:{}", proxy_port);
  let client = reqwest::Client::builder()
    .timeout(Duration::new(timeout.unwrap_or(10), 0))
    .proxy(reqwest::Proxy::all(proxy_url)?)
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0")
    .build()?;

  let now = Instant::now();
  let status = client
    .get("https://www.google.com/generate_204")
    .send()
    .await?
    .status();
  let elapsed = now.elapsed().as_millis() as i32;

  if status.is_success() {
    Ok(elapsed)
  } else {
    // 999999 表示超时或失败
    Ok(999999)
  }
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

fn show_main_window(app: &AppHandle) -> Result<()> {
  if let Some(window) = app.get_window("main") {
    window.show()?;
  }

  Ok(())
}

fn main() {
  let show = CustomMenuItem::new("show", "Show");
  let exit = CustomMenuItem::new("exit", "Exit");
  let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(exit);

  let mut builder = tauri::Builder::default();

  if cfg!(not(debug_assertions)) {
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      app
        .emit_all("single-instance", Payload { args: argv, cwd })
        .unwrap();
    }));
  }

  builder
    .plugin(
      tauri_plugin_log::Builder::default()
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
        .build(),
    )
    .plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      Some(vec!["-a"]),
    ))
    .system_tray(
      SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("Trebuchet"),
    )
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::DoubleClick {
        tray_id: _,
        position: _,
        size: _,
        ..
      }
      | SystemTrayEvent::LeftClick {
        tray_id: _,
        position: _,
        size: _,
        ..
      } => {
        show_main_window(app).unwrap();
      }
      SystemTrayEvent::MenuItemClick { tray_id: _, id, .. } => match id.as_str() {
        "show" => {
          show_main_window(app).unwrap();
        }
        "exit" => {
          app.exit(0);
        }
        _ => {}
      },
      _ => {}
    })
    .on_window_event(|event| match event.event() {
      WindowEvent::CloseRequested { api, .. } => {
        event.window().hide().unwrap();
        api.prevent_close();
      }
      _ => {}
    })
    .setup(|app| {
      let resolver = app.path_resolver();

      // 清空配置目录
      if let Some(mut config_dir) = resolver.app_config_dir() {
        config_dir.push("config");
        let _ = fs::remove_dir_all(&config_dir);
        fs::create_dir_all(&config_dir)?;
      }

      // 创建数据目录，并复制文件
      if let Some(data_dir) = resolver.app_data_dir() {
        fs::create_dir_all(&data_dir)?;
        copy_resource_if_not_exists(app, "geoip.dat")?;
        copy_resource_if_not_exists(app, "geosite.dat")?;
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      download,
      download_resource,
      get_available_port,
      test_latency
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
