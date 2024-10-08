// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_handle;
mod command;
mod db;
mod error;
mod xray;

use std::fs;

use app_handle::set_app_handle;
use command::{
  endpoint::{
    get_current_endpoint, select_fastest_endpoint, set_current_endpoint,
    start_check_current_endpoint, XrayState,
  },
  subscription::{update_subscription, update_subscriptions},
  update_geosites,
};
use db::{
  db_count_endpoints, db_count_subscriptions, db_get_settings, db_insert_subscription,
  db_insert_website, db_query_endpoints, db_query_flows, db_query_logs, db_query_subscriptions,
  db_query_websites, db_remove_subscription, db_remove_website, db_set_settings,
  db_update_subscription, initialize, subscription::db_get_updating_subscription_ids, DbState,
};
use error::{map_anything, Result};
use log::LevelFilter;
use tauri::{
  App, AppHandle, CustomMenuItem, Manager, State, SystemTray, SystemTrayEvent, SystemTrayMenu,
  SystemTrayMenuItem, WindowBuilder,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{
  fern::colors::{Color, ColoredLevelConfig},
  LogTarget,
};
use tokio_schedule::{every, Job};

#[derive(Clone, serde::Serialize)]
struct Payload {
  args: Vec<String>,
  cwd: String,
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

/// 导出 API 绑定代码
#[cfg(debug_assertions)]
fn export_bindings() {
  use command::query_stats::AllStats;
  //use db::settings::Settings;
  use specta::{
    collect_types,
    ts::{BigIntExportBehavior, ExportConfiguration},
  };

  let config = ExportConfiguration::new().bigint(BigIntExportBehavior::Number);

  println!("{}", specta::ts::export::<AllStats>(&config).unwrap());

  tauri_specta::ts::export_with_cfg(
    collect_types![
      db_count_endpoints,
      db_count_subscriptions,
      db_get_settings,
      db_insert_subscription,
      db_insert_website,
      db_query_endpoints,
      db_query_flows,
      db_query_logs,
      db_query_subscriptions,
      db_query_websites,
      db_remove_subscription,
      db_remove_website,
      db_set_settings,
      db_update_subscription,
      get_current_endpoint,
      select_fastest_endpoint,
      set_current_endpoint,
      update_subscription,
      update_subscriptions,
      db_get_updating_subscription_ids,
    ]
    .unwrap(),
    config,
    "../src/api/bindings.ts",
  )
  .unwrap();
}

fn create_system_try() -> SystemTray {
  let show = CustomMenuItem::new("show", "Show");
  let restart = CustomMenuItem::new("restart", "Restart");
  let exit = CustomMenuItem::new("exit", "Exit");
  let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(restart)
    .add_item(exit);

  SystemTray::new()
    .with_menu(tray_menu)
    .with_tooltip("Trebuchet")
}

/// 显示主窗口。如果没有主窗口，则根据配置创建一个。
fn show_main_window(app: &AppHandle) -> Result<()> {
  if let Some(window) = app.get_window("main") {
    window.show()?;
    window.set_focus()?;
    window.request_user_attention(Some(tauri::UserAttentionType::Informational))?;
  } else {
    WindowBuilder::from_config(app, app.config().tauri.windows[0].clone()).build()?;
  }

  Ok(())
}

fn main() {
  #[cfg(debug_assertions)]
  export_bindings();

  let update_geo = every(12).hours().perform(|| update_geosites());
  tauri::async_runtime::spawn(update_geo);

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
        .targets([LogTarget::Stderr, LogTarget::LogDir])
        .level(LevelFilter::Warn)
        .level_for("trebuchet", LevelFilter::Trace)
        .level_for("webview", LevelFilter::Trace)
        .with_colors(
          ColoredLevelConfig::new()
            .error(Color::Red)
            .warn(Color::Yellow)
            .info(Color::Green)
            .debug(Color::Blue),
        )
        .build(),
    )
    .plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      Some(vec!["-a"]),
    ))
    .system_tray(create_system_try())
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::DoubleClick { .. } | SystemTrayEvent::LeftClick { .. } => {
        show_main_window(app).unwrap();
      }
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "show" => {
          show_main_window(app).unwrap();
        }
        "restart" => {
          app.restart();
        }
        "exit" => {
          app.exit(0);
        }
        _ => {}
      },
      _ => {}
    })
    .manage(DbState::default())
    .manage(XrayState::default())
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

      // 连接数据库
      let handle = app.handle();
      set_app_handle(&handle);

      tauri::async_runtime::block_on(async move {
        let state: State<DbState> = handle.state();
        let db = initialize(&handle, false).await.unwrap();
        let mut db_guard = state.db.lock().await;
        *db_guard = Some(db);
      });

      // 更新订阅并开启计时器
      let handle = app.handle();
      tauri::async_runtime::spawn(async move {
        update_subscriptions(handle).await.unwrap();
        start_check_current_endpoint().await.unwrap();
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      db_count_endpoints,
      db_count_subscriptions,
      db_get_settings,
      db_insert_subscription,
      db_insert_website,
      db_query_endpoints,
      db_query_flows,
      db_query_logs,
      db_query_subscriptions,
      db_query_websites,
      db_remove_subscription,
      db_remove_website,
      db_set_settings,
      db_update_subscription,
      get_current_endpoint,
      select_fastest_endpoint,
      set_current_endpoint,
      update_subscription,
      update_subscriptions,
      db_get_updating_subscription_ids,
    ])
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => {}
    });
}
