use base64::{prelude::BASE64_STANDARD, Engine};

use crate::error::Result;

pub(crate) fn try_base64_decode(s: String) -> Result<String> {
  // 尝试 base64 解码
  let decoded = BASE64_STANDARD.decode(&s);

  if let Ok(decoded) = decoded {
    let body = String::from_utf8(decoded)?;
    Ok(body)
  } else {
    Ok(s)
  }
}
