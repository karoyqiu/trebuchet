use log::info;
use tauri::{AppHandle, State};
use tokio::task::JoinSet;

use crate::db::select;
use crate::db::{db_query_subscriptions, subscription::Subscription, DbState};
use crate::error::Result;

/// 更新全部订阅
#[tauri::command]
#[specta::specta]
pub async fn update_subscriptions(state: State<'_, DbState>) -> Result<()> {
  info!("Updating all subscriptions");
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

  let sub = select::<Subscription>(&app, sub_id).await?;
  sub.update().await?;

  info!("Subscription {} updated", sub_id);
  Ok(())
}
