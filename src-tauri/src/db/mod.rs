use std::sync::Arc;

use log::debug;
use ormlite::{
  sqlite::{
    Sqlite, SqliteConnectOptions, SqliteConnection, SqliteJournalMode, SqliteRow, SqliteSynchronous,
  },
  Connection, Executor, FromRow, Model, Row, TableMeta,
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

/// 通知数据库变动
fn notify_change<T>(app: &AppHandle) -> Result<()>
where
  T: TableMeta,
{
  let event = format!("app://db/{}", T::table_name());
  app.emit_all(event.as_str(), ())?;
  Ok(())
}

/// 更新
async fn update<T>(app: &AppHandle, doc: T) -> Result<bool>
where
  T: Model<Sqlite> + TableMeta + Send,
{
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  doc.update_all_fields(db).await?;

  // 通知数据库变动
  notify_change::<T>(&app)?;

  Ok(true)
}

/// 删除
async fn remove<T>(app: &AppHandle, id: i64) -> Result<bool>
where
  T: Model<Sqlite> + TableMeta + Send,
{
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let sql = format!("DELETE FROM {} WHERE id = ?", T::table_name());
  ormlite::query(sql.as_str())
    .bind(id)
    .fetch_optional(db)
    .await?;

  // 通知数据库变动
  notify_change::<T>(&app)?;

  Ok(true)
}

/// 查询
async fn query<T>(state: State<'_, DbState>) -> Result<Vec<T>>
where
  T: Model<Sqlite> + for<'r> FromRow<'r, SqliteRow> + Send + Sync + Unpin + 'static,
{
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let items = T::select().fetch_all(db).await?;
  Ok(items)
}

/// 计数
async fn count<T>(state: State<'_, DbState>) -> Result<u32>
where
  T: TableMeta,
{
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let sql = format!("SELECT COUNT(*) FROM {}", T::table_name());
  let row = ormlite::query(sql.as_str()).fetch_one(db).await?;
  let count = row.try_get::<u32, usize>(0)?;
  Ok(count)
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
  notify_change::<Subscription>(&app)?;

  Ok(true)
}

/// 删除订阅
#[tauri::command]
#[specta::specta]
pub async fn db_remove_subscription(app: AppHandle, id: i64) -> Result<bool> {
  remove::<Subscription>(&app, id).await
}

/// 更新订阅
#[tauri::command]
#[specta::specta]
pub async fn db_update_subscription(app: AppHandle, doc: Subscription) -> Result<bool> {
  update(&app, doc).await
}

/// 查询订阅
#[tauri::command]
#[specta::specta]
pub async fn db_query_subscriptions(state: State<'_, DbState>) -> Result<Vec<Subscription>> {
  query::<Subscription>(state).await
}

/// 查询订阅数量
#[tauri::command]
#[specta::specta]
pub async fn db_count_subscriptions(state: State<'_, DbState>) -> Result<u32> {
  count::<Subscription>(state).await
}
