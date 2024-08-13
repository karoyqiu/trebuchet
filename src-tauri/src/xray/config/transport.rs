use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use specta::Type;

/// 使用标准的 Unix domain socket 来传输数据。
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct DomainSocketObject {
  /// 一个合法的文件路径。在运行 Xray 之前，这个文件必须不存在。
  pub path: String,
  /// 是否为 abstract domain socket，默认值 `false`。
  pub abstract_socket: Option<bool>,
  /// abstract domain socket 是否带 padding，默认值 `false`。
  pub padding: Option<bool>,
}

/// 基于 gRPC 的传输方式。
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct GRPCObject {
  /// 一个字符串，指定服务名称，类似于 HTTP/2 中的 Path。客户端会使用此名称进行通信，服务端会验证服务名称是否匹配。
  pub service_name: String,
  /// `true` 启用 `multiMode`，默认值为： `false`。
  pub multi_mode: Option<bool>,
  /// 设置 gRPC 的用户代理，可能能防止某些 CDN 阻止 gRPC 流量。以下字段只需在出站（客户端）配置。
  pub user_agent: Option<String>,
  /// 单位秒，当这段时间内没有数据传输时，将会进行健康检查。如果此值设置为 `10` 以下，将会使用 `10`，即最小值。健康检查默认**不启用**。
  pub idle_timeout: Option<u32>,
  /// 单位秒，健康检查的超时时间。如果在这段时间内没有完成健康检查，且仍然没有数据传输时，即认为健康检查失败。默认值为 `20`。
  pub health_check_timeout: Option<u32>,
  /// `true` 允许在没有子连接时进行健康检查。默认值为 `false`。
  pub permit_without_stream: Option<bool>,
  /// h2 Stream 初始窗口大小。当值小于等于 `0` 时，此功能不生效。当值大于 `65535` 时，动态窗口机制（Dynamic Window）会被禁用。默认值为 `0`，即不生效。
  pub initial_windows_size: Option<u32>,
}

/// 基于 HTTP/2 的传输方式。
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct HttpObject {
  /// 一个字符串数组，每一个元素是一个域名。
  pub host: Vec<String>,
  /// HTTP 路径，由 `/` 开头, 客户端和服务器必须一致。默认值为 `"/"`。
  pub path: Option<String>,
  /// HTTP 方法。默认值为 `"PUT"`。
  pub method: Option<String>,
  /// HTTP 头，一个键值对，每个键表示一个 HTTP 头的名称，对应的值是一个数组。
  pub headers: Option<HashMap<String, Vec<String>>>,
  /// 单位秒，当这段时间内没有数据传输时，将会进行健康检查。健康检查默认**不启用**。
  pub read_idle_timeout: Option<i64>,
  /// 单位秒，健康检查的超时时间。如果在这段时间内没有完成健康检查，且仍然没有数据传输时，即认为健康检查失败。默认值为 `20`。
  pub health_check_timeout: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize, Type)]
pub struct HeaderObject {
  /// 伪装类型，可选的值有：
  ///
  /// - `"none"`：默认值，不进行伪装，发送的数据是没有特征的数据包。
  /// - `"srtp"`：伪装成 SRTP 数据包，会被识别为视频通话数据（如 FaceTime）。
  /// - `"utp"`：伪装成 uTP 数据包，会被识别为 BT 下载数据。
  /// - `"wechat-video"`：伪装成微信视频通话的数据包。
  /// - `"dtls"`：伪装成 DTLS 1.2 数据包。
  /// - `"wireguard"`：伪装成 WireGuard 数据包。（并不是真正的 WireGuard 协议）
  #[serde(rename = "type")]
  pub type_: Option<String>,
}

/// mKCP 使用 UDP 来模拟 TCP 连接。
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct KcpObject {
  /// 最大传输单元（maximum transmission unit），请选择一个介于 576 - 1460 之间的值。默认值为 `1350`。
  pub mtu: Option<u32>,
  /// 传输时间间隔（transmission time interval），单位毫秒（ms），mKCP 将以这个时间频率发送数据。请选译一个介于 10 - 100 之间的值。默认值为 `50`。
  pub tti: Option<u32>,
  /// 上行链路容量，即主机发出数据所用的最大带宽，单位 MB/s，注意是 Byte 而非 bit。可以设置为 0，表示一个非常小的带宽。默认值 `5`。
  pub uplink_capacity: u32,
  /// 下行链路容量，即主机接收数据所用的最大带宽，单位 MB/s，注意是 Byte 而非 bit。可以设置为 0，表示一个非常小的带宽。默认值 `20`。
  pub downlink_capacity: u32,
  /// 是否启用拥塞控制。默认值为 `false`。
  pub congestion: Option<bool>,
  /// 单个连接的读取缓冲区大小，单位是 MB。默认值为 `2`。
  pub read_buffer_size: Option<u32>,
  /// 单个连接的写入缓冲区大小，单位是 MB。默认值为 `2`。
  pub write_buffer_size: Option<u32>,
  /// 数据包头部伪装设置
  pub header: Option<HeaderObject>,
  /// 可选的混淆密码，使用 AES-128-GCM 算法混淆流量数据，客户端和服务端需要保持一致。
  pub seed: String,
}

/// 基于 QUIC 的传输方式。
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct QuicObject {
  /// 加密方式。默认值为不加密。
  pub security: Option<String>,
  /// 加密时所用的密钥。
  pub key: Option<String>,
  /// 数据包头部伪装设置
  pub header: Option<HeaderObject>,
}
