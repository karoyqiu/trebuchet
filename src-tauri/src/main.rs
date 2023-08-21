// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
use error::Result;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn download(url: &str) -> Result<String> {
  let body = reqwest::get(url).await?.text().await?;
  Ok(body)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![download])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
