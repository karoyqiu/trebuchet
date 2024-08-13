use serde::{Deserialize, Serialize};
use specta::Type;

/// 日志配置
#[derive(Debug, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LogObject {
  /// 访问日志的文件地址，其值是一个合法的文件地址，如 `"/var/log/Xray/access.log"`（Linux）或者 `"C:\\Temp\\Xray\\_access.log"`（Windows）。当此项不指定或为空值时，表示将日志输出至 stdout。
  ///
  /// 特殊值 `"none"`，即关闭 access log。
  pub access: Option<String>,
  /// 访问日志的文件地址，其值是一个合法的文件地址，如 `"/var/log/Xray/error.log"`（Linux）或者 `"C:\\Temp\\Xray\\_error.log"`（Windows）。当此项不指定或为空值时，表示将日志输出至 stdout。
  ///
  /// 特殊值 `"none"`，即关闭 error log。
  pub error: Option<String>,
  /// error 日志的级别, 指示 error 日志需要记录的信息。默认值为 `"warning"`。
  ///
  /// - `"debug"`：调试程序时用到的输出信息。同时包含所有 `"info"` 内容。
  /// - `"info"`：运行时的状态信息等，不影响正常使用。同时包含所有 `"warning"` 内容。
  /// - `"warning"`：发生了一些并不影响正常运行的问题时输出的信息，但有可能影响用户的体验。同时包含所有 `"error"` 内容。
  /// - `"error"`：Xray 遇到了无法正常运行的问题，需要立即解决。
  /// - `"none"`：不记录任何内容。
  pub loglevel: Option<String>,
  /// 是否启用 DNS 查询日志
  pub dns_log: Option<bool>,
}
