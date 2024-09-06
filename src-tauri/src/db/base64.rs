use std::string::FromUtf8Error;

use base64::{
  alphabet::STANDARD,
  engine::{DecodePaddingMode, GeneralPurpose, GeneralPurposeConfig},
  Engine,
};
use log::warn;

const MAY_PAD: GeneralPurposeConfig =
  GeneralPurposeConfig::new().with_decode_padding_mode(DecodePaddingMode::Indifferent);

pub const BASE64_STANDARD_MAY_PAD: GeneralPurpose = GeneralPurpose::new(&STANDARD, MAY_PAD);

pub(crate) fn try_base64_decode(s: String) -> Result<String, FromUtf8Error> {
  // 尝试 base64 解码
  match BASE64_STANDARD_MAY_PAD.decode(&s) {
    Ok(decoded) => {
      let body = String::from_utf8(decoded)?;
      Ok(body)
    }

    Err(e) => {
      warn!("Base64 decode error: {:?}", e);
      Ok(s)
    }
  }
}
