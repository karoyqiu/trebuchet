export interface ServerObject {
  /** 服务端地址，支持 IPv4、IPv6 和域名。 */
  address: string;
  /** 服务端端口。 */
  port: number;
  /** 密码 */
  password: string;
  /** 邮件地址，可选，用于标识用户。 */
  email?: string;
  /** 用户等级，连接会使用这个用户等级对应的本地策略。默认为 0。 */
  level?: number;
}

/** Trojan 协议 */
export default interface TrojanOutboundConfigurationObject {
  /** Trojan 协议 */
  protocol: 'trojan';
  settings: {
    /** 一个数组，代表一组 Trojan 服务端设置。 */
    servers: ServerObject[];
  };
}
