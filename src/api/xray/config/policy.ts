interface LevelPolicyObject {
  /** 连接建立时的握手时间限制。单位为秒。默认值为 `4`。在入站代理处理一个新连接时，在握手阶段如果使用的时间超过这个时间，则中断该连接。 */
  handshake?: number;
  /** 连接空闲的时间限制。单位为秒。默认值为 `300`。inbound/outbound 处理一个连接时，如果在 `connIdle` 时间内，没有任何数据被传输（包括上行和下行数据），则中断该连接。 */
  connIdle?: number;
  /** 当连接下行线路关闭后的时间限制。单位为秒。默认值为 `2`。当服务器（如远端网站）关闭下行连接时，出站代理会在等待 `uplinkOnly` 时间后中断连接。 */
  uplinkOnly?: number;
  /** 当连接上行线路关闭后的时间限制。单位为秒。默认值为 `5`。当客户端（如浏览器）关闭上行连接时，入站代理会在等待 `downlinkOnly` 时间后中断连接。 */
  downlinkOnly?: number;
  /** 当值为 `true` 时，开启当前等级的所有用户的上行流量统计。 */
  statsUserUplink?: boolean;
  /** 当值为 `true` 时，开启当前等级的所有用户的下行流量统计。 */
  statsUserDownlink?: boolean;
  /** 每个连接的内部缓存大小。单位为 kB。当值为 `0` 时，内部缓存被禁用。 */
  bufferSize?: number;
}

/** 系统级别的策略 */
interface SystemPolicyObject {
  /** 当值为 `true` 时，开启所有入站代理的上行流量统计。 */
  statsInboundUplink?: boolean;
  /** 当值为 `true` 时，开启所有入站代理的下行流量统计。 */
  statsInboundDownlink?: boolean;
  /** 当值为 `true` 时，开启所有出站代理的上行流量统计。 */
  statsOutboundUplink?: boolean;
  /** 当值为 `true` 时，开启所有出站代理的下行流量统计。 */
  statsOutboundDownlink?: boolean;
}

/**
 * 本地策略，可以设置不同的用户等级和对应的策略设置，比如连接超时设置。Xray 处理的每一个连接都对应一个用户，按照用户的等级（level）应用不同的策略。
 */
export default interface PolicyObject {
  /** 一组键值对，每个键是一个字符串形式的数字（JSON 的要求），比如 `"0"`、`"1"` 等，双引号不能省略，此数字对应用户等级。 */
  levels?: Record<number, LevelPolicyObject>;
  /** 系统级别的策略 */
  system?: SystemPolicyObject;
}
