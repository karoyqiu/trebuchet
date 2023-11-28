export interface HeaderObject {
  /**
   * 伪装类型，可选的值有：
   *
   * - `"none"`：默认值，不进行伪装，发送的数据是没有特征的数据包。
   * - `"srtp"`：伪装成 SRTP 数据包，会被识别为视频通话数据（如 FaceTime）。
   * - `"utp"`：伪装成 uTP 数据包，会被识别为 BT 下载数据。
   * - `"wechat-video"`：伪装成微信视频通话的数据包。
   * - `"dtls"`：伪装成 DTLS 1.2 数据包。
   * - `"wireguard"`：伪装成 WireGuard 数据包。（并不是真正的 WireGuard 协议）
   */
  type?: 'none' | 'srtp' | 'utp' | 'wechat-video' | 'dtls' | 'wireguard';
}

/** mKCP 使用 UDP 来模拟 TCP 连接。 */
export default interface KcpObject {
  /** 最大传输单元（maximum transmission unit），请选择一个介于 576 - 1460 之间的值。默认值为 `1350`。 */
  mtu?: number;
  /** 传输时间间隔（transmission time interval），单位毫秒（ms），mKCP 将以这个时间频率发送数据。请选译一个介于 10 - 100 之间的值。默认值为 `50`。 */
  tti?: number;
  /** 上行链路容量，即主机发出数据所用的最大带宽，单位 MB/s，注意是 Byte 而非 bit。可以设置为 0，表示一个非常小的带宽。默认值 `5`。 */
  uplinkCapacity: number;
  /** 下行链路容量，即主机接收数据所用的最大带宽，单位 MB/s，注意是 Byte 而非 bit。可以设置为 0，表示一个非常小的带宽。默认值 `20`。 */
  downlinkCapacity: number;
  /** 是否启用拥塞控制。默认值为 `false`。 */
  congestion?: boolean;
  /** 单个连接的读取缓冲区大小，单位是 MB。默认值为 `2`。 */
  readBufferSize?: number;
  /** 单个连接的写入缓冲区大小，单位是 MB。默认值为 `2`。 */
  writeBufferSize?: number;
  /** 数据包头部伪装设置 */
  header?: HeaderObject;
  /** 可选的混淆密码，使用 AES-128-GCM 算法混淆流量数据，客户端和服务端需要保持一致。 */
  seed: string;
}
