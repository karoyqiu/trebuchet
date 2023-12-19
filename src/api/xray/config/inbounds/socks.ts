export interface AccountObject {
  /** 用户名 */
  user: string;
  /** 密码 */
  pass: string;
}

/** Socks 入站连接配置 */
export default interface SocksInboundConfigurationObject {
  /** 标准 Socks 协议实现，兼容 Socks 4、Socks 4a 和 Socks 5。 */
  protocol: 'socks';
  settings: {
    /** Socks 协议的认证方式，支持 `"noauth"` 匿名方式和 `"password"` 用户密码方式。默认值为 `"noauth"`。 */
    auth?: 'noauth' | 'password';
    /** 一个数组，数组中每个元素为一个用户帐号。 */
    accounts?: AccountObject[];
    /** 是否开启 UDP 协议的支持。默认值为 `false`。 */
    udp?: boolean;
    /** 当开启 UDP 时，Xray 需要知道本机的 IP 地址。默认值为 `"127.0.0.1"`。 */
    ip?: string;
    /** 用户等级，连接会使用这个用户等级对应的本地策略。如不指定, 默认为 0。 */
    userLevel?: number;
  };
}
