use std::sync::Arc;
use std::time::{Duration, Instant};

use log::{debug, info};
use ormlite::TableMeta;
use ormlite::{
  model::{HasModelBuilder, ModelBuilder},
  Executor, Model,
};
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};
use tokio::sync::Semaphore;
use tokio::task::JoinSet;
use tokio_js_set_interval::{clear_interval, set_interval_async};

use crate::app_handle::get_app_handle;
use crate::{
  db::{
    db_query_endpoints, endpoint::Endpoint, get_settings, notify_change, select,
    settings::Settings, DbState,
  },
  error::Result,
  xray::Xray,
};

use super::query_stats::query_all_stats;

#[derive(Default)]
pub struct XrayState {
  pub xray: Arc<Mutex<Option<Xray>>>,
  pub stats_timer_id: Arc<Mutex<u64>>,
  pub check_timer_id: Arc<Mutex<u64>>,
}

/// 测试全部节点的连接速度
async fn test_latencies(app: AppHandle) -> Result<()> {
  let state: State<DbState> = app.state();
  {
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");
    let sql = format!("UPDATE {} SET latency = -1", Endpoint::table_name());
    db.execute(sql.as_str()).await?;
    notify_change::<Endpoint>(&app)?;
  }

  let eps = db_query_endpoints(state).await?;
  info!("Testing latencies for all {} endpoints", eps.len());

  let settings = get_settings(&app).await?;
  let sem = Arc::new(Semaphore::new(settings.ep_test_concurrency as usize));

  // 这里得一个一个地起 xray，因为每次都要不同的端口
  let mut tests = JoinSet::new();

  for ep in eps {
    let permit = Arc::clone(&sem).acquire_owned().await;
    let app = app.clone();
    let settings = settings.clone();
    let xray = Xray::new(ep);

    tests.spawn(async move {
      let _permit = permit;
      let _ = test_endpoint(&app, xray, &settings).await;
    });
  }

  while let Some(_) = tests.join_next().await {}
  info!("All endpoints tested");
  Ok(())
}

/// 设置当前节点
#[tauri::command]
#[specta::specta]
pub async fn get_current_endpoint(state: State<'_, XrayState>) -> Result<Option<i64>> {
  let xray_guard = state.xray.lock().await;
  if let Some(xray) = xray_guard.as_ref() {
    Ok(Some(xray.endpoint().id))
  } else {
    Ok(None)
  }
}

/// 设置当前节点
#[tauri::command]
#[specta::specta]
pub async fn set_current_endpoint(app: AppHandle, ep_id: i64) -> Result<()> {
  let ep: Endpoint = select(&app, ep_id).await?;
  let settings = get_settings(&app).await?;
  info!("Set current endpoint {:?}", &ep);

  let state: State<XrayState> = app.state();
  let mut xray_guard = state.xray.lock().await;

  if let Some(mut xray) = xray_guard.take() {
    xray.stop().await?;
  }

  let mut xray = Xray::new(ep);
  xray.start(&settings.rule).await?;
  xray.wait_for_started().await?;
  let port = xray.port().unwrap_or_default();
  *xray_guard = Some(xray);

  app.emit_all("app://endpoint/current", ())?;

  start_query_stats(&state, port).await;

  Ok(())
}

async fn start_query_stats(state: &State<'_, XrayState>, api_port: u16) {
  let mut guard = state.stats_timer_id.lock().await;

  if *guard != 0 {
    clear_interval(*guard);
  }

  *guard = if api_port != 0 {
    set_interval_async!(move || { query_all_stats(api_port) }, 1000)
  } else {
    0
  };
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

async fn test_endpoint(app: &AppHandle, xray: Xray, settings: &Settings) -> Result<()> {
  let ep = xray.endpoint().clone();
  info!("Testing endpoint {} - {}", ep.id, &ep.name);

  let latency = test_xray(xray, settings).await.unwrap_or(999999);
  debug!("Endpoint {} latency {}", ep.id, latency);

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

async fn test_xray(mut xray: Xray, settings: &Settings) -> Result<i32> {
  xray.start("test").await?;
  xray.wait_for_started().await?;

  let latency = test_port(xray.port().unwrap(), &settings.ep_test_url)
    .await
    .unwrap_or(999999);
  xray.stop().await?;

  Ok(latency)
}

async fn test_port(proxy_port: u16, url: &String) -> Result<i32> {
  let proxy_url = format!("socks5://127.0.0.1:{}", proxy_port);
  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(10))
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

/// 启动自动检查当前节点
pub async fn start_check_current_endpoint() -> Result<()> {
  let app = get_app_handle().expect("No app handle");
  let state: State<XrayState> = app.state();
  let mut guard = state.check_timer_id.lock().await;

  if *guard != 0 {
    clear_interval(*guard);
  }

  let settings = get_settings(&app).await?;
  let interval = settings.ep_test_interval as u64 * 60 * 1000;

  info!(
    "Starting check current endpoint every {} minutes",
    settings.ep_test_interval
  );

  *guard = set_interval_async!(
    || tokio::task::spawn(async {
      check_current_endpoint().await.unwrap();
    }),
    interval
  );

  Ok(())
}

async fn check_current_endpoint() -> Result<()> {
  let app = get_app_handle().expect("No app handle");
  let started = {
    let state: State<XrayState> = app.state();
    let xray = state.xray.lock().await;

    if let Some(xray) = xray.as_ref() {
      if xray.port().unwrap_or_default() > 0 {
        true
      } else {
        false
      }
    } else {
      false
    }
  };
  debug!("Checking current endpoint {}", started);

  if started {
    let settings = get_settings(&app).await?;
    let latency = test_port(settings.socks_port, &settings.ep_test_url)
      .await
      .unwrap_or(999999);
    info!("Current latency {}", latency);

    if latency >= 999999 {
      select_fastest_endpoint(app).await?;
    }
  }

  Ok(())
}
