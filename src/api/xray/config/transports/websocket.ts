/** 使用标准的 WebSocket 来传输数据。 */
export default interface WebSocketObject {
  /** 仅用于 inbound，指示是否接收 PROXY protocol。 */
  acceptProxyProtocol?: boolean;
  /** WebSocket 所使用的 HTTP 协议路径，默认值为 `"/"`。 */
  path?: string;
  /** 自定义 HTTP 头，一个键值对，每个键表示一个 HTTP 头的名称，对应的值是字符串。默认值为空。 */
  headers?: Record<string, string>;
}
