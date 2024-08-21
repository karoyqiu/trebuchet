use std::sync::{Arc, Mutex};

use log::{info, warn};
use tauri::{Manager, State};
use tokio_js_set_interval::{clear_interval, set_interval};

use crate::{
  app_handle::get_app_handle, command::subscription::update_subscriptions, db::get_settings,
  error::Result,
};

#[derive(Default)]
pub struct SubTimerState {
  pub timer_id: Arc<Mutex<Option<u64>>>,
}

fn auto_update() {
  let app = get_app_handle();

  tauri::async_runtime::block_on(async move {
    if let Some(app) = app {
      let _ = update_subscriptions(app).await;
    } else {
      warn!("No app handle when auto update subscriptions");
    }
  });
}

/// 启动自动更新订阅
pub async fn start_auto_update_subscriptions() -> Result<()> {
  let app = get_app_handle().expect("No app handle");
  let state: State<SubTimerState> = app.state();
  let mut guard = state.timer_id.lock().unwrap();

  if let Some(timer_id) = *guard {
    clear_interval(timer_id);
  }

  let settings = get_settings(&app).await?;
  let interval = settings.sub_update_interval as u64 * 60 * 1000;

  info!(
    "Starting auto update subscriptions every {} minutes",
    settings.sub_update_interval
  );
  let timer_id = set_interval!(auto_update, interval);
  *guard = Some(timer_id);

  Ok(())
}
