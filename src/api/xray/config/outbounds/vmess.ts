/** 加密方式 */
export type VMessSecurity = 'aes-128-gcm' | 'chacha20-poly1305' | 'auto' | 'none' | 'zero';

interface UserObject {
  /** 用户 ID */
  id: string;
  /** 加密方式 */
  security?: VMessSecurity;
  /** 用户等级，连接会使用这个用户等级对应的本地策略。默认为 0。 */
  level?: number;
}

interface ServerObject {
  /** 服务端地址，支持 IPv4、IPv6 和域名。 */
  address: string;
  /** 服务端端口。 */
  port: number;
  /** 一组服务端认可的用户列表 */
  users: UserObject[];
}

/** VMess 协议 */
export default interface VMessOutboundConfigurationObject {
  /** VMess 协议 */
  protocol: 'vmess';
  settings: {
    /** 一个数组，代表一组 Trojan 服务端设置。 */
    vnext: ServerObject[];
  };
}
