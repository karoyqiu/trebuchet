import { ServerObject as TrojanServerObject } from './trojan';

interface ServerObject extends TrojanServerObject {
  /**  */
  method: string;
  /** 启用 `UDP over TCP`。 */
  uot?: boolean;
  /** `UDP over TCP` 的实现版本。 */
  UoTVersion?: 1 | 2;
}

/** Shadowsocks 协议 */
export default interface ShadowsocksOutboundConfigurationObject {
  /** Shadowsocks 协议 */
  protocol: 'shadowsocks';
  settings: {
    /** 一个数组，代表一组 Shadowsocks 服务端设置。 */
    servers: ServerObject[];
  };
}
