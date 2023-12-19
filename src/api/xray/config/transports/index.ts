import DomainSocketObject from './domainsocket';
import GRPCOBject from './grpc';
import HttpObject from './h2';
import KcpObject from './mkcp';
import QuicObject from './quic';
import TcpObject from './tcp';
import WebSocketObject from './websocket';

/** 全局传输方式配置 */
export interface TransportObject {
  /** 针对 TCP 连接的配置。 */
  tcpSettings?: TcpObject;
  /** 针对 mKCP 连接的配置。 */
  kcpSettings?: KcpObject;
  /** 针对 WebSocket 连接的配置。 */
  wsSettings?: WebSocketObject;
  /** 针对 HTTP/2 连接的配置。 */
  httpSettings?: HttpObject;
  /** 针对 QUIC 连接的配置。 */
  quicSettings?: QuicObject;
  /** 针对 gRPC 连接的配置。 */
  dsSettings?: DomainSocketObject;
  /** 针对 Domain Socket 连接的配置。 */
  grpcSettings?: GRPCOBject;
}

interface CertificateObject {
  /** OCSP 装订更新，与证书热重载的时间间隔。单位：秒。默认值为 3600，即一小时。 */
  ocspStapling?: number;
  /** 仅加载一次。值为 true 时将关闭证书热重载功能与 ocspStapling 功能。 */
  oneTimeLoading: true | false;
  /**
   * 证书用途，默认值为 `"encipherment"`。
   *
   * - `"encipherment"`：证书用于 TLS 认证和加密。
   * - `"verify"`：证书用于验证远端 TLS 的证书。当使用此项时，当前证书必须为 CA 证书。
   * - `"issue"`：证书用于签发其它证书。当使用此项时，当前证书必须为 CA 证书。
   */
  usage?: 'encipherment' | 'verify' | 'issue';
  /** 证书文件路径，如使用 OpenSSL 生成，后缀名为 .crt。 */
  certificateFile?: string;
  /** 一个字符串数组，表示证书内容，格式如样例所示。`certificate` 和 `certificateFile` 二者选一。 */
  certificate?: string[];
  /** 密钥文件路径，如使用 OpenSSL 生成，后缀名为 .key。目前暂不支持需要密码的 key 文件。 */
  keyFile?: string;
  /** 一个字符串数组，表示密钥内容，格式如样例如示。`key` 和 `keyFile` 二者选一。 */
  key?: string[];
}

interface TLSObject {
  /** 指定服务器端证书的域名，在连接由 IP 建立时有用。 */
  serverName?: string;
  /** 当值为 `true` 时，服务端接收到的 SNI 与证书域名不匹配即拒绝 TLS 握手，默认为 false。 */
  rejectUnknownSni?: boolean;
  /** 一个字符串数组，指定了 TLS 握手时指定的 ALPN 数值。默认值为 `["h2", "http/1.1"]`。 */
  alpn?: string[];
  /** minVersion 为可接受的最小 TLS 版本。 */
  minVersion?: string;
  /** maxVersion 为可接受的最大 TLS 版本。 */
  maxVersion?: string;
  /** 用于配置受支持的密码套件列表, 每个套件名称之间用:进行分隔。 */
  cipherSuites?: string;
  /** 是否允许不安全连接（仅用于客户端）。默认值为 `false`。 */
  allowInsecure?: boolean;
  /** 是否禁用操作系统自带的 CA 证书。默认值为 `false`。 */
  disableSystemRoot?: boolean;
  /** 此参数的设置为 false 时, ClientHello 里没有 session_ticket 这个扩展。默认值为 `false`。 */
  enableSessionResumption?: boolean;
  /**
   * 此参数用于配置指定 `TLS Client Hello` 的指纹。当其值为空时，表示不启用此功能。启用后，Xray 将通过 uTLS 库 **模拟** `TLS` 指纹，或随机生成。支持三种配置方式：
   *
   * 1. 常见浏览器最新版本的 TLS 指纹 包括
   *
   * - `"chrome"`
   * - `"firefox"`
   * - `"safari"`
   * - `"ios"`
   * - `"android"`
   * - `"edge"`
   * - `"360"`
   * - `"qq"`
   *
   * 2. 在 xray 启动时自动生成一个指纹
   *
   * - `"random"`: 在较新版本的浏览器里随机抽取一个
   * - `"randomized"`: 完全随机生成一个独一无二的指纹 (100% 支持 TLS 1.3 使用 X25519)
   *
   * 3. 使用 uTLS 原生指纹变量名 例如`"HelloRandomizedNoALPN"` `"HelloChrome_106_Shuffle"`。完整名单见 [uTLS 库](https://github.com/refraction-networking/utls/blob/master/u_common.go#L434)
   */
  fingerprint?: string;
  /** 用于指定远程服务器的证书链 SHA256 散列值，使用标准编码格式。仅有当服务器端证书链散列值符合设置项中之一时才能成功建立 TLS 连接。 */
  pinnedPeerCertificateChainSha256?: string[];
  /** 证书列表，其中每一项表示一个证书（建议 fullchain）。 */
  certificates?: CertificateObject[];
}

interface TLSTransportObject {
  security: 'tls';
  /** TLS 配置。 */
  tlsSettings?: TLSObject;
}

/** Reality 入站（服务端）配置。 */
interface RealityInboundObject {
  /** 格式同 VLESS `fallbacks` 的 [dest](https://xtls.github.io/config/features/fallback.html#fallbackobject)。 */
  dest: string;
  /** 格式同 VLESS `fallbacks` 的 [xver](https://xtls.github.io/config/features/fallback.html#fallbackobject)。 */
  xver?: number;
  /** 客户端可用的 `serverName` 列表，暂不支持 \* 通配符。 */
  serverNames: string[];
  /** 执行 `./xray x25519` 生成。 */
  privateKey: string;
  /** 客户端 Xray 最低版本，格式为 `x.y.z`。 */
  minClientVer?: string;
  /** 客户端 Xray 最高版本，格式为 `x.y.z`。 */
  maxClientVer?: string;
  /** 允许的最大时间差，单位为毫秒。 */
  maxTimeDiff?: number;
  /** 客户端可用的 `shortId` 列表，可用于区分不同的客户端。 */
  shortIds: string[];
}

/** Reality 出站（客户端）配置。 */
interface RealityOutboundObject {
  /** 服务端 serverNames 之一。 */
  serverName: string;
  /**  必填，同 TLSObject。*/
  fingerprint: string;
  /** 服务端 shortIds 之一。 */
  shortID: string;
  /** 服务端私钥对应的公钥。使用 `./xray x25519 -i "服务器私钥"` 生成。 */
  publicKey: string;
  /** 爬虫初始路径与参数，建议每个客户端不同。 */
  spiderX?: string;
}

type RealityObject = {
  /** 当值为 `true` 时，输出调试信息。 */
  show?: boolean;
} & (RealityInboundObject | RealityOutboundObject);

interface RealityTransportObject {
  security: 'reality';
  /** Reality 配置。 */
  realitySettings: RealityObject;
}

interface InsecureTransportObject {
  security?: 'none';
}

interface SockoptObject {
  /** 一个整数。当其值非零时，在 outbound 连接上以此数值标记 SO_MARK。 */
  mark?: number;
  /** 用于设置 TCP 数据包的最大传输单元。 */
  tcpMaxSeg: number;
  /** 是否启用 [TCP Fast Open](https://zh.wikipedia.org/wiki/TCP%E5%BF%AB%E9%80%9F%E6%89%93%E5%BC%80)。 */
  tcpFastOpen: boolean | number;
  /** 是否开启透明代理（仅适用于 Linux）。 */
  tproxy?: 'redirect' | 'tproxy' | 'off';
  /** 默认值为 `"AsIs"`。 */
  domainStrategy?: 'AsIs' | 'UseIP' | 'UseIPv4' | 'UseIPv6';
  /** 一个出站代理的标识。当值不为空时，将使用指定的 outbound 发出连接。 */
  dialerProxy?: string;
  /** 仅用于 inbound，指示是否接收 PROXY protocol。 */
  acceptProxyProtocol?: boolean;
  /** TCP 保持活跃的数据包发送间隔，单位为秒。该设置仅适用于 Linux 下。 */
  tcpKeepAliveInterval?: number;
  /** TCP 空闲时间阈值，单位为秒。当 TCP 连接空闲时间达到这个阈值时，将开始发送 Keep-Alive 探测包。 */
  tcpKeepAliveIdle?: number;
  /** 单位为毫秒。 */
  tcpUserTimeout?: number;
  /** TCP 拥塞控制算法。仅支持 Linux。 */
  tcpcongestion?: 'bbr' | 'cubic' | 'reno';
  /** 指定绑定出口网卡名称 仅支持 linux。 */
  interface?: string;
}

export type NetworkType = 'tcp' | 'kcp' | 'ws' | 'http' | 'h2' | 'domainsocket' | 'quic' | 'grpc';

export type StreamSettingsObject = TransportObject &
  (InsecureTransportObject | TLSTransportObject | RealityTransportObject) & {
    /** 连接的数据流所使用的传输方式类型，默认值为 `"tcp"`。 */
    network?: NetworkType;
    /** 透明代理相关的具体配置。 */
    sockopt?: SockoptObject;
  };
