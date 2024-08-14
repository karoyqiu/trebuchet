use std::net::TcpListener;

use log::info;
use tauri::{AppHandle, Manager, State};
use tokio::task::JoinSet;

use crate::db::{db_query_subscriptions, DbState};
use crate::error::Result;

/// 更新订阅
#[tauri::command]
#[specta::specta]
pub async fn update_subscriptions(app: AppHandle) -> Result<()> {
  info!("Updating all subscriptions");
  let state: State<DbState> = app.state();
  let subs = db_query_subscriptions(state).await?;
  let mut set = JoinSet::new();

  for sub in subs {
    let disabled = sub.disabled.unwrap_or_default();

    if !disabled {
      set.spawn(async move {
        let _ = sub.update().await;
      });
    }
  }

  while let Some(_) = set.join_next().await {}

  info!("All subscriptions updated");
  Ok(())
}

/// 获取可用于侦听的 TCP 端口。
#[tauri::command]
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}
