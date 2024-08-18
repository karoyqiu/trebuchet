use std::net::TcpListener;

use crate::error::Result;

pub mod endpoint;
pub mod query_stats;
pub mod subscription;

/// 获取可用于侦听的 TCP 端口
#[tauri::command]
#[specta::specta]
pub fn get_available_port() -> Result<u16> {
  let listener = TcpListener::bind("127.0.0.1:0")?;
  let addr = listener.local_addr()?;
  Ok(addr.port())
}
