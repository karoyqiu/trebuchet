interface ResponseObject {
  /**
   * 当 `type` 为 `"none"`（默认值）时，Blackhole 将直接关闭连接。
   *
   * 当 `type` 为 `"http"` 时，Blackhole 会发回一个简单的 HTTP 403 数据包，然后关闭连接。
   */
  type?: 'none' | 'http';
}

/** Blackhole（黑洞）是一个出站数据协议，它会阻碍所有数据的出站，配合路由配置一起使用，可以达到禁止访问某些网站的效果。 */
export default interface BlackholeOutboundConfigurationObject {
  /** Blackhole 协议 */
  protocol: 'blackhole';
  settings: {
    /** 配置黑洞的响应数据。如不指定此项，Blackhole 将直接关闭连接。 */
    response?: ResponseObject;
  };
}
