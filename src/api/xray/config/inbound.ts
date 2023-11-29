import { StreamSettingsObject } from './transports';

interface AccountObject {
  /** 用户名 */
  user: string;
  /** 密码 */
  pass: string;
}

/** Socks 入站连接配置 */
interface SocksInboundConfigurationObject {
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

/** HTTP 入站连接配置 */
interface HttpInboundConfigurationObject {
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

interface SniffingObject {
  /** 是否开启流量探测。 */
  enabled: boolean;
  /** 当流量为指定类型时，按其中包括的目标地址重置当前连接的目标。 */
  destOverride?: ('http' | 'tls' | 'quic' | 'fakedns' | 'fakedns+others')[];
  /** 当启用时，将仅使用连接的元数据嗅探目标地址。 */
  metadataOnly?: boolean;
  /** 一个域名列表，如果流量探测结果在这个列表中时，将 **不会** 重置目标地址。 */
  domainsExcluded?: string[];
  /** 将嗅探得到的域名仅用于路由，代理目标地址仍为 IP。默认值为 `false`。 */
  routeOnly?: boolean;
}

interface AllocateObject {
  /**
   * 端口分配策略。
   *
   * - `"always"` 表示总是分配所有已指定的端口，`port` 中指定了多少个端口，Xray 就会监听这些端口。
   * - `"random"` 表示随机开放端口，每隔 `refresh` 分钟在 `port` 范围中随机选取 `concurrency` 个端口来监听。
   */
  strategy: 'always' | 'random';
  /** 随机端口刷新间隔，单位为分钟。最小值为 `2`，建议值为 `5`。 */
  refresh?: number;
  /** 随机端口数量。最小值为 `1`，最大值为 `port` 范围的三分之一。建议值为 `3`。 */
  concurrency?: number;
}

/** 入站连接配置 */
interface CommonInboundObject {
  /** 监听地址，IP 地址或 Unix domain socket，默认值为 `"0.0.0.0"`，表示接收所有网卡上的连接。 */
  listen: string;
  /**
   * 端口。接受的格式如下:
   *
   * - 整型数值：实际的端口号。
   * - 环境变量：以 `"env:"` 开头，后面是一个环境变量的名称，如 `"env:PORT"`。Xray 会以字符串形式解析这个环境变量。
   * - 字符串：可以是一个数值类型的字符串，如 `"1234"`；或者一个数值范围，如 `"5-10"` 表示端口 5 到端口 10，这 6 个端口。可以使用逗号进行分段，如 `11,13,15-17` 表示端口 11、端口 13、端口 15 到端口 17 这 5 个端口。
   *
   * 当只有一个端口时，Xray 会在此端口监听入站连接。当指定了一个端口范围时，取决于 `allocate` 设置。
   */
  port: number | string;
  /** 底层传输方式（transport）是当前 Xray 节点和其它节点对接的方式。 */
  streamSettings?: StreamSettingsObject;
  /** 此入站连接的标识，用于在其它的配置中定位此连接。当其不为空时，其值必须在所有 `tag` 中**唯一**。 */
  tag?: string;
  /** 流量探测主要作用于在透明代理等用途。 */
  sniffing?: SniffingObject;
  /** 当设置了多个 port 时, 端口分配的具体设置。 */
  allocate?: AllocateObject;
}

/** 入站连接配置 */
type InboundObject = CommonInboundObject &
  (SocksInboundConfigurationObject | HttpInboundConfigurationObject);

export default InboundObject;
