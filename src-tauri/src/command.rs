use std::net::TcpListener;
use std::time::{Duration, Instant};

use log::info;
use ormlite::model::{HasModelBuilder, ModelBuilder};
use ormlite::Model;
use tauri::{AppHandle, Manager, State};
use tokio::task::JoinSet;

use crate::db::endpoint::Endpoint;
use crate::db::subscription::Subscription;
use crate::db::{db_query_subscriptions, get_settings, DbState};
use crate::error::Result;
use crate::xray::Xray;

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

/// 获取可用于侦听的 TCP 端口
#[tauri::command]
#[specta::specta]
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}

/// 测试单个节点的连接速度
#[tauri::command]
#[specta::specta]
pub async fn test_latency(app: AppHandle, ep_id: i64) -> Result<()> {
  let state: State<DbState> = app.state();
  let ep = {
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");
    Endpoint::select()
      .where_bind("id = ?", ep_id)
      .fetch_one(db)
      .await?
  };

  let mut xray = Xray::new(ep.clone());
  xray.start("test").await?;
  xray.wait_for_started().await?;

  let latency = test_port(xray.port().unwrap()).await?;
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");
  ep.update_partial()
    .latency(Some(latency))
    .update(db)
    .await?;

  Ok(())
}

async fn test_port(proxy_port: u16) -> Result<i32> {
  let settings = get_settings().await?;
  let proxy_url = format!("socks5://127.0.0.1:{}", proxy_port);
  let client = reqwest::Client::builder()
    .timeout(Duration::new((settings.ep_test_interval * 60).into(), 0))
    .proxy(reqwest::Proxy::all(proxy_url)?)
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0")
    .build()?;

  let now = Instant::now();
  let status = client.head(settings.ep_test_url).send().await?.status();
  let elapsed = now.elapsed().as_millis() as i32;

  if status.is_success() {
    Ok(elapsed)
  } else {
    // 999999 表示超时或失败
    Ok(999999)
  }
}
