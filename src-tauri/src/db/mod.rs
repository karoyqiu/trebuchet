pub mod endpoint;
pub mod settings;
pub mod subscription;

use std::sync::Arc;

use endpoint::Endpoint;
use log::debug;
use ormlite::{
  model::{HasModelBuilder, ModelBuilder},
  sqlite::{
    Sqlite, SqliteConnectOptions, SqliteConnection, SqliteJournalMode, SqliteRow, SqliteSynchronous,
  },
  types::Json,
  Connection, Executor, FromRow, Model, Row, TableMeta,
};
use settings::{Settings, SettingsTable};
use subscription::Subscription;
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};

use crate::error::Result;

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

    let sql = format!(
      "CREATE TABLE IF NOT EXISTS {} ({} INTEGER PRIMARY KEY, settings TEXT NOT NULL)",
      SettingsTable::table_name(),
      SettingsTable::primary_key().unwrap()
    );
    db.execute(sql.as_str()).await?;

    let sql = format!(
      "CREATE TABLE IF NOT EXISTS {} ({} INTEGER PRIMARY KEY, sub_id INTEGER NOT NULL REFERENCES {}(id) ON DELETE CASCADE ON UPDATE CASCADE, uri TEXT NOT NULL, name TEXT NOT NULL, host TEXT NOT NULL, port INTEGER NOT NULL, latency INTEGER)",
      Endpoint::table_name(),
      Endpoint::primary_key().unwrap(),
      Subscription::table_name(),
    );
    db.execute(sql.as_str()).await?;

    let sql = format!(
      "CREATE UNIQUE INDEX IF NOT EXISTS unique_endpoint ON {} (host, port)",
      Endpoint::table_name()
    );
    db.execute(sql.as_str()).await?;

    // let sql = format!("PRAGMA user_version = {}", CURRENT_DB_VERSION);
    // db.execute(sql.as_str()).await?;
  }

  Ok(())
}

/// 通知数据库变动
pub fn notify_change<T>(app: &AppHandle) -> Result<()>
where
  T: TableMeta,
{
  let event = format!("app://db/{}", T::table_name());
  app.emit_all(event.as_str(), ())?;
  Ok(())
}

/// 更新
async fn update<T>(app: &AppHandle, doc: T) -> Result<()>
where
  T: Model<Sqlite> + TableMeta + Send,
{
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  doc.update_all_fields(db).await?;

  // 通知数据库变动
  notify_change::<T>(&app)?;

  Ok(())
}

/// 删除
async fn remove<T>(app: &AppHandle, id: i64) -> Result<()>
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

  Ok(())
}

/// 查询
async fn query<T>(state: &State<'_, DbState>) -> Result<Vec<T>>
where
  T: Model<Sqlite> + for<'r> FromRow<'r, SqliteRow> + Send + Sync + Unpin + 'static,
{
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  let items = T::select().fetch_all(db).await?;
  Ok(items)
}

/// 计数
async fn count<T>(state: &State<'_, DbState>) -> Result<u32>
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

/// 获取设置
#[tauri::command]
#[specta::specta]
pub async fn db_get_settings(state: State<'_, DbState>) -> Result<Settings> {
  let all = query::<SettingsTable>(&state).await?;

  if !all.is_empty() {
    return Ok(all[0].settings.0.clone());
  }

  let settings = Settings {
    socks_port: 1089,
    http_port: 1090,
    allow_lan: false,
    // 1 小时更新一次
    sub_update_interval: 60,
    ep_test_interval: 3,
    ep_test_concurrency: 32,
    ep_test_url: String::from("https://www.google.com/generate_204"),
    rule: String::from("default"),
  };

  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  SettingsTable {
    id: 1,
    settings: Json::from(settings.clone()),
  }
  .insert(db)
  .await?;

  Ok(settings)
}

/// 保存设置
#[tauri::command]
#[specta::specta]
pub async fn db_set_settings(state: State<'_, DbState>, settings: Settings) -> Result<()> {
  let all = query::<SettingsTable>(&state).await?;
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");
  let settings = Json::from(settings);

  if all.is_empty() {
    SettingsTable { id: 1, settings }.insert(db).await?;
  } else {
    let s = &all[0];
    s.update_partial().settings(settings).update(db).await?;
  }

  Ok(())
}

/// 插入订阅
#[tauri::command]
#[specta::specta]
pub async fn db_insert_subscription(app: AppHandle, doc: Subscription) -> Result<()> {
  let state: State<DbState> = app.state();
  let mut db_guard = state.db.lock().await;
  let db = db_guard.as_mut().expect("Database not intialized");

  Subscription::builder()
    .name(doc.name)
    .url(doc.url)
    .insert(db)
    .await?;

  // 通知数据库变动
  notify_change::<Subscription>(&app)?;

  Ok(())
}

/// 删除订阅
#[tauri::command]
#[specta::specta]
pub async fn db_remove_subscription(app: AppHandle, id: i64) -> Result<()> {
  remove::<Subscription>(&app, id).await
}

/// 更新订阅
#[tauri::command]
#[specta::specta]
pub async fn db_update_subscription(app: AppHandle, doc: Subscription) -> Result<()> {
  let sub_id = doc.id;
  let disabled = doc.disabled.unwrap_or_default();
  let result = update(&app, doc).await;

  if result.is_ok() && disabled {
    // 禁用的全部删除
    let state: State<DbState> = app.state();
    let mut db_guard = state.db.lock().await;
    let db = db_guard.as_mut().expect("Database not intialized");

    ormlite::query("DELETE FROM endpoint WHERE sub_id = ?")
      .bind(sub_id)
      .fetch_optional(db)
      .await?;
  }

  result
}

/// 查询订阅
#[tauri::command]
#[specta::specta]
pub async fn db_query_subscriptions(state: State<'_, DbState>) -> Result<Vec<Subscription>> {
  query::<Subscription>(&state).await
}

/// 查询订阅数量
#[tauri::command]
#[specta::specta]
pub async fn db_count_subscriptions(state: State<'_, DbState>) -> Result<u32> {
  count::<Subscription>(&state).await
}

/// 查询节点
#[tauri::command]
#[specta::specta]
pub async fn db_query_endpoints(state: State<'_, DbState>) -> Result<Vec<Endpoint>> {
  query::<Endpoint>(&state).await
}

/// 查询节点数量
#[tauri::command]
#[specta::specta]
pub async fn db_count_endpoints(state: State<'_, DbState>) -> Result<u32> {
  count::<Endpoint>(&state).await
}
