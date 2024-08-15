use std::net::TcpListener;
use std::sync::Arc;
use std::time::{Duration, Instant};

use log::info;
use ormlite::model::{HasModelBuilder, ModelBuilder};
use ormlite::Model;
use tauri::{AppHandle, Manager, State};
use tokio::sync::{Mutex, Semaphore};
use tokio::task::JoinSet;

use crate::db::settings::Settings;
use crate::db::{db_query_endpoints, notify_change, select};
use crate::db::{
  db_query_subscriptions, endpoint::Endpoint, get_settings, subscription::Subscription, DbState,
};
use crate::error::Result;
use crate::xray::Xray;

pub mod subscription;
pub mod endpoint;

pub struct XrayState {
  pub xray: Arc<Mutex<Option<Xray>>>,
}

/// 获取可用于侦听的 TCP 端口
#[tauri::command]
#[specta::specta]
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}
