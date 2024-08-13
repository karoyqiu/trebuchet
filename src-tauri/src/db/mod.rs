use std::sync::Arc;

use log::debug;
use ormlite::{
  sqlite::{SqliteConnectOptions, SqliteConnection, SqliteJournalMode, SqliteSynchronous},
  Connection, Executor, Model, Row, TableMeta,
};
use subscription::Subscription;
use tauri::{async_runtime::Mutex, AppHandle, State};

use crate::error::Result;

pub mod endpoint;
pub mod subscription;

const CURRENT_DB_VERSION: u32 = 2;

pub struct DbState {
  pub db: Arc<Mutex<Option<SqliteConnection>>>,
}

/// 初始化数据库
pub async fn initialize(app_handle: &AppHandle, readonly: bool) -> Result<SqliteConnection> {
  let app_dir = app_handle
    .path_resolver()
    .app_data_dir()
    .expect("The app data directory should exist.");
  tokio::fs::create_dir_all(&app_dir)
    .await
    .expect("The app data directory should be created.");
  let sqlite_path = app_dir.join("trebuchet.db");

  let options = SqliteConnectOptions::new()
    .filename(sqlite_path)
    .journal_mode(SqliteJournalMode::Wal)
    .synchronous(SqliteSynchronous::Normal)
    .foreign_keys(true)
    .pragma("optimize", "0x10002")
    .create_if_missing(!readonly)
    .optimize_on_close(!readonly, None)
    .read_only(readonly);
  let mut db = SqliteConnection::connect_with(&options).await?;

  upgrade_if_needed(&mut db).await?;

  Ok(db)
}

async fn upgrade_if_needed(db: &mut SqliteConnection) -> Result<()> {
  let version = db.fetch_one("PRAGMA user_version").await?;
  let version = version.try_get::<u32, usize>(0)?;
  debug!("Current db version {}", version);

  if version < CURRENT_DB_VERSION {
    let sql = format!("CREATE TABLE IF NOT EXISTS {} ({} INTEGER PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL, disabled INTEGER)", Subscription::table_name(), Subscription::primary_key().unwrap());
    db.execute(sql.as_str()).await?;

    // let sql = format!("PRAGMA user_version = {}", CURRENT_DB_VERSION);
    // db.execute(sql.as_str()).await?;
  }

  Ok(())
}

/// 插入订阅
#[tauri::command]
#[specta::specta]
pub async fn db_insert_subscription(state: State<'_, DbState>, doc: Subscription) -> Result<bool> {
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  doc.insert(db).await?;

  Ok(true)
}
