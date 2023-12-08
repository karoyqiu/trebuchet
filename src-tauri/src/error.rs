// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Anyhow(#[from] anyhow::Error),
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Net(#[from] reqwest::Error),
  #[error(transparent)]
  Serde(#[from] serde_json::Error),
  #[error(transparent)]
  Tauri(#[from] tauri::Error),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

// pub fn map_any_error<E>(value: E) -> Error
// where
//   E: std::error::Error + Send + Sync + 'static,
// {
//   Error::Anyhow(anyhow::anyhow!(value))
// }

pub fn map_anything<E>(value: E) -> Error
where
  E: ToString,
{
  Error::Anyhow(anyhow::anyhow!(value.to_string()))
}

pub type Result<T> = std::result::Result<T, Error>;
