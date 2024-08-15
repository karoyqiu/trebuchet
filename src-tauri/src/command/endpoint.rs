use std::sync::Arc;
use std::time::{Duration, Instant};

use log::info;
use ormlite::{
  model::{HasModelBuilder, ModelBuilder},
  Model,
};
use tauri::{AppHandle, Manager, State};
use tokio::sync::{Mutex, Semaphore};

use crate::{
  db::{
    db_query_endpoints, endpoint::Endpoint, get_settings, notify_change, select,
    settings::Settings, DbState,
  },
  error::Result,
  xray::Xray,
};

pub struct XrayState {
  pub xray: Arc<Mutex<Option<Xray>>>,
}

/// 测试全部节点的连接速度
#[tauri::command]
#[specta::specta]
pub async fn test_latencies(app: AppHandle) -> Result<()> {
  info!("Testing latencies for all endpoints");
  let state: State<DbState> = app.state();
  let eps = db_query_endpoints(state).await?;

  let settings = get_settings(&app).await?;
  let sem = Arc::new(Semaphore::new(settings.ep_test_concurrency as usize));

  for ep in eps {
    let permit = Arc::clone(&sem).acquire_owned().await;
    let app = app.clone();
    let settings = settings.clone();
    tauri::async_runtime::spawn(async move {
      let _permit = permit;
      let _ = test_endpoint(&app, &ep, &settings).await;
    });
  }

  Ok(())
}

/// 测试单个节点的连接速度
#[tauri::command]
#[specta::specta]
pub async fn test_latency(app: AppHandle, ep_id: i64) -> Result<()> {
  let ep: Endpoint = select(&app, ep_id).await?;
  info!("Testing latency for endpoint {} - {}", ep.id, &ep.name);
  let settings = get_settings(&app).await?;
  test_endpoint(&app, &ep, &settings).await?;

  Ok(())
}
/// 设置当前节点
#[tauri::command]
#[specta::specta]
pub async fn get_current_endpoint(state: State<'_, XrayState>) -> Result<i64> {
  let xray_guard = state.xray.lock().await;
  let xray = xray_guard.as_ref().expect("No current endpoint");
  Ok(xray.endpoint().id)
}

/// 设置当前节点
#[tauri::command]
#[specta::specta]
pub async fn set_current_endpoint(app: AppHandle, ep_id: i64) -> Result<()> {
  let ep: Endpoint = select(&app, ep_id).await?;
  let settings = get_settings(&app).await?;
  info!("Set current endpoint {} - {}", ep.id, &ep.name);

  let state: State<XrayState> = app.state();
  let mut xray_guard = state.xray.lock().await;
  *xray_guard = None;

  let mut xray = Xray::new(ep);
  xray.start(&settings.rule).await?;
  xray.wait_for_started().await?;
  *xray_guard = Some(xray);

  app.emit_all("app://endpoint/current", ())?;

  Ok(())
}

/// 给所有节点测速，并选择最快的节点
#[tauri::command]
#[specta::specta]
pub async fn select_fastest_endpoint(app: AppHandle) -> Result<i64> {
  info!("Selecting fastest endpoint");
  test_latencies(app.clone()).await?;

  let ep = {
    let state: State<DbState> = app.state();
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");

    Endpoint::select()
      .where_bind("latency > ?", 0)
      .order_asc("latency")
      .limit(1)
      .fetch_one(db)
      .await?
  };

  set_current_endpoint(app, ep.id).await?;
  Ok(ep.id)
}

async fn test_endpoint(app: &AppHandle, ep: &Endpoint, settings: &Settings) -> Result<()> {
  let mut xray = Xray::new(ep.clone());
  xray.start("test").await?;
  xray.wait_for_started().await?;

  let latency = test_port(
    xray.port().unwrap(),
    settings.ep_test_interval,
    &settings.ep_test_url,
  )
  .await?;

  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");
  ep.update_partial()
    .latency(Some(latency))
    .update(db)
    .await?;

  notify_change::<Endpoint>(app)?;

  Ok(())
}

async fn test_port(proxy_port: u16, timeout: u32, url: &String) -> Result<i32> {
  let proxy_url = format!("socks5://127.0.0.1:{}", proxy_port);
  let client = reqwest::Client::builder()
    .timeout(Duration::new((timeout * 60).into(), 0))
    .proxy(reqwest::Proxy::all(proxy_url)?)
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0")
    .build()?;

  let now = Instant::now();
  let status = client.head(url).send().await?.status();
  let elapsed = now.elapsed().as_millis() as i32;

  if status.is_success() {
    Ok(elapsed)
  } else {
    // 999999 表示超时或失败
    Ok(999999)
  }
}
