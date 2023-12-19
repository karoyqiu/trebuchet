/** 不进行伪装 */
interface NoneHeaderObject {
  /** 指定不进行伪装 */
  type: 'none';
}

/** HTTP 请求 */
interface HttpRequestObject {
  /** HTTP 版本，默认值为 `"1.1"`。 */
  version?: string;
  /** HTTP 方法，默认值为 `"GET"`。 */
  method?: string;
  /** 路径，一个字符串数组。默认值为 `["/"]`。当有多个值时，每次请求随机选择一个值。 */
  path?: string[];
  /** HTTP 头，一个键值对，每个键表示一个 HTTP 头的名称，对应的值是一个数组。 */
  headers?: Record<string, string[]>;
}

/** HTTP 请求 */
interface HttpResponseObject {
  /** HTTP 版本，默认值为 `"1.1"`。 */
  version?: string;
  /** HTTP 状态，默认值为 `"200"`。 */
  status?: string;
  /** HTTP 状态说明，默认值为 `"OK"`。 */
  reason?: string;
  /** HTTP 头，一个键值对，每个键表示一个 HTTP 头的名称，对应的值是一个数组。 */
  headers?: Record<string, string[]>;
}

/** HTTP 伪装配置必须在对应的入站出站连接上同时配置，且内容必须一致。 */
interface HttpHeaderObject {
  /** 指定进行 HTTP 伪装 */
  type: 'http';
  /** HTTP 请求 */
  request: HttpRequestObject;
  /** HTTP 响应 */
  response: HttpResponseObject;
}

/** TCP 传输模式是目前推荐使用的传输模式之一 */
export default interface TcpObject {
  /** 仅用于 inbound，指示是否接收 PROXY protocol。默认值为 `false`。 */
  acceptProxyProtocol?: boolean;
  /** 数据包头部伪装设置，默认值为 `NoneHeaderObject`。 */
  header?: NoneHeaderObject | HttpHeaderObject;
}
