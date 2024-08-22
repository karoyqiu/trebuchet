use log::info;
use ormlite::{Executor, TableMeta};
use tauri::{AppHandle, Manager, State};
use tokio::task::JoinSet;

use crate::{
  command::endpoint::select_fastest_endpoint,
  db::{db_query_subscriptions, endpoint::Endpoint, select, subscription::Subscription, DbState},
  error::Result,
};

/// 更新全部订阅
#[tauri::command]
#[specta::specta]
pub async fn update_subscriptions(app: AppHandle) -> Result<()> {
  info!("Updating all subscriptions");
  let state: State<DbState> = app.state();
  {
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");
    let sql = format!("DELETE FROM {}", Endpoint::table_name());
    db.execute(sql.as_str()).await?;
  }

  let subs = db_query_subscriptions(state).await?;
  let mut set = JoinSet::new();

  for sub in subs {
    let disabled = sub.disabled.unwrap_or_default();

    if !disabled {
      set.spawn(async move {
        sub.update().await.unwrap();
      });
    }
  }

  while let Some(_) = set.join_next().await {}
  info!("All subscriptions updated");

  select_fastest_endpoint(app).await?;

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
