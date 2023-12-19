interface UserObject {
  /** 用户 ID */
  id: string;
  /** 提醒使用者没有加密 */
  encryption: 'none';
  /** 流控模式，用于选择 XTLS 的算法。 */
  flow: string;
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

/** VLESS 协议 */
export default interface VLESSOutboundConfigurationObject {
  /** VLESS 协议 */
  protocol: 'vless';
  settings: {
    /** 一个数组，代表一组 Trojan 服务端设置。 */
    vnext: ServerObject[];
  };
}
