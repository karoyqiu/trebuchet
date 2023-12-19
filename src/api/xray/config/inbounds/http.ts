import { AccountObject } from './socks';

/** HTTP 入站连接配置 */
export default interface HttpInboundConfigurationObject {
  protocol: 'http';
  settings: {
    /**
     * 连接空闲的时间限制。单位为秒。默认值为 `300`, 0 表示不限时。
     *
     * 处理一个连接时，如果在 `timeout` 时间内，没有任何数据被传输，则中断该连接。
     */
    timeout?: number;
    /** 一个数组，数组中每个元素为一个用户帐号。 */
    accounts?: AccountObject[];
    /** 当为 `true` 时，会转发所有 HTTP 请求，而非只是代理请求。 */
    allowTransparent?: boolean;
    /** 用户等级，连接会使用这个用户等级对应的本地策略。如不指定, 默认为 0。 */
    userLevel?: number;
  };
}
