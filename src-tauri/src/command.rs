use std::net::TcpListener;

use log::info;
use ormlite::Model;
use tauri::{AppHandle, Manager, State};
use tokio::task::JoinSet;

use crate::db::subscription::Subscription;
use crate::db::{db_query_subscriptions, DbState};
use crate::error::Result;

/// 更新全部订阅
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

/// 更新单个订阅
#[tauri::command]
#[specta::specta]
pub async fn update_subscription(app: AppHandle, sub_id: i64) -> Result<()> {
  info!("Updating subscription {}", sub_id);
  let sub = {
    let state: State<DbState> = app.state();
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");
    Subscription::select()
      .where_bind("id = ?", sub_id)
      .fetch_one(db)
      .await?
  };

  sub.update().await?;

  info!("Subscription {} updated", sub_id);
  Ok(())
}

/// 获取可用于侦听的 TCP 端口。
#[tauri::command]
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}
