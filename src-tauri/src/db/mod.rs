use std::sync::Arc;

use log::debug;
use ormlite::{
  sqlite::{SqliteConnectOptions, SqliteConnection, SqliteJournalMode, SqliteSynchronous},
  Connection, Executor, Model, Row, TableMeta,
};
use subscription::Subscription;
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};

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
pub async fn db_insert_subscription(app: AppHandle, doc: Subscription) -> Result<bool> {
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  doc.insert(db).await?;

  // 通知数据库变动
  app.emit_all("app://db/subscription", ())?;

  Ok(true)
}

/// 删除订阅
#[tauri::command]
#[specta::specta]
pub async fn db_remove_subscription(app: AppHandle, id: i64) -> Result<bool> {
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  Subscription::query("DELETE FROM subscription WHERE id = ?")
    .bind(id)
    .fetch_one(db)
    .await?;

  // 通知数据库变动
  app.emit_all("app://db/subscription", ())?;

  Ok(true)
}

/// 更新订阅
#[tauri::command]
#[specta::specta]
pub async fn db_update_subscription(app: AppHandle, doc: Subscription) -> Result<bool> {
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  doc.update_all_fields(db).await?;

  // 通知数据库变动
  app.emit_all("app://db/subscription", ())?;

  Ok(true)
}

/// 查询订阅
#[tauri::command]
#[specta::specta]
pub async fn db_query_subscriptions(state: State<'_, DbState>) -> Result<Vec<Subscription>> {
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let items = Subscription::select().fetch_all(db).await?;
  Ok(items)
}

/// 查询订阅数量
#[tauri::command]
#[specta::specta]
pub async fn db_count_subscriptions(state: State<'_, DbState>) -> Result<u32> {
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let row = ormlite::query("SELECT COUNT(*) FROM subscription")
    .fetch_one(db)
    .await?;
  let count = row.try_get::<u32, usize>(0)?;
  Ok(count)
}
