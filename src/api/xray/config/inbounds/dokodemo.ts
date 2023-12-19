/** Dokodemo door（任意门）可以监听一个本地端口，并把所有进入此端口的数据发送至指定服务器的一个端口，从而达到端口映射的效果。 */
export default interface DokodemoDoorInboundConfigurationObject {
  protocol: 'dokodemo-door';
  settings: {
    /** 服务端地址，支持 IPv4、IPv6 和域名。 */
    address: string;
    /** 服务端端口。 */
    port?: number;
    /** 可接收的网络协议类型。比如当指定为 `"tcp"` 时，仅会接收 TCP 流量。默认值为 `"tcp"`。 */
    network?: 'tcp' | 'udp' | 'tcp,udp';
    /**
     * 连接空闲的时间限制。单位为秒。默认值为 `300`, 0 表示不限时。
     *
     * 处理一个连接时，如果在 `timeout` 时间内，没有任何数据被传输，则中断该连接。
     */
    timeout?: number;
    /** 当值为 `true` 时，dokodemo-door 会识别出由 iptables 转发而来的数据，并转发到相应的目标地址。 */
    followRedirect?: boolean;
    /** 用户等级，连接会使用这个用户等级对应的本地策略。如不指定, 默认为 0。 */
    userLevel?: number;
  };
}
