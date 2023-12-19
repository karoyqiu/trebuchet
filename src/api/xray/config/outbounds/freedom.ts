/** Freedom 是一个出站协议，可以用来向任意网络发送（正常的） TCP 或 UDP 数据。 */
export default interface FreedomOutboundConfigurationObject {
  /** Freedom 协议 */
  protocol: 'freedom';
  settings: {
    /** 默认值为 `"AsIs"`。 */
    domainStrategy?: 'AsIs' | 'UseIP' | 'UseIPv4' | 'UseIPv6';
    /** 强制将所有数据发送到指定地址（而不是 inbound 指定的地址）。其值为一个字符串，样例：`"127.0.0.1:80"`，`":1234"`。 */
    redirect?: string;
    /** 用户等级，连接会使用这个用户等级对应的本地策略。默认为 0。 */
    userLevel?: number;
    /** 控制发出的 TCP 分片 */
    fragment?: {
      /** 支持两种分片方式 "1-3" 是 TCP 的流切片，应用于客户端第 1 至第 3 次写数据。"tlshello" 是 TLS 握手包切片。 */
      packets: '1-3' | 'tlshello';
      /** 分片包长（byte） */
      length: string;
      /** 分片间隔（ms） */
      interval: string;
    };
  };
}
