/** DNS 服务器 */
interface ServerObject {
  /** DNS 服务器地址 */
  address: string;
  /** DNS 服务器端口，如 `53`。此项缺省时默认为 `53`。 */
  port?: number;
  /** 一个域名列表，此列表包含的域名，将优先使用此服务器进行查询。域名格式和 {@link RuleObject|路由配置} 中相同。 */
  domains: string[];
  /**
   * 一个 IP 范围列表，格式和 {@link RuleObject|路由配置} 中相同。
   *
   * 当配置此项时，Xray DNS 会对返回的 IP 的进行校验，只返回包含 `expectIPs` 列表中的地址。
   *
   * 如果未配置此项，会原样返回 IP 地址。
   */
  expectIPs?: string[];
  /** `true`，在进行 DNS fallback 查询时将跳过此服务器, 默认为 `false`，即不跳过。 */
  skipFallback?: boolean;
}

/** 内置 DNS 服务器 */
export default interface DnsObject {
  /**
   * 静态 IP 列表，其值为一系列的 "域名": "地址" 或 "域名": ["地址 1","地址 2"]。其中地址可以是 IP 或者域名。在解析域名时，如果域名匹配这个列表中的某一项：
   *
   * - 当该项的地址为 IP 时，则解析结果为该项的 IP
   * - 当该项的地址为域名时，会使用此域名进行 IP 解析，而不使用原始域名。
   * - 当地址中同时设置了多个 IP 和域名，则只会返回第一个域名，其余 IP 和域名均被忽略。
   *
   * 域名的格式有以下几种形式：
   *
   * - 纯字符串：当此字符串完整匹配目标域名时，该规则生效。例如 "xray.com" 匹配 "xray.com"，但不匹配 "www.xray.com"。
   * - 正则表达式：由 `"regexp:"` 开始，余下部分是一个正则表达式。当此正则表达式匹配目标域名时，该规则生效。例如 "regexp:\\\\.goo.\*\\\\.com\$" 匹配 "www.google.com"、"fonts.googleapis.com"，但不匹配 "google.com"。
   * - 子域名 (推荐)：由 `"domain:"` 开始，余下部分是一个域名。当此域名是目标域名或其子域名时，该规则生效。例如 "domain:xray.com" 匹配 "www.xray.com" 与 "xray.com"，但不匹配 "wxray.com"。
   * - 子串：由 `"keyword:"` 开始，余下部分是一个字符串。当此字符串匹配目标域名中任意部分，该规则生效。比如 "keyword:sina.com" 可以匹配 "sina.com"、"sina.com.cn" 和 "www.sina.com"，但不匹配 "sina.cn"。
   * - 预定义域名列表：由 `"geosite:"` 开头，余下部分是一个名称，如 `geosite:google` 或者 `geosite:cn`。名称及域名列表参考[预定义域名列表](https://xtls.github.io/config/routing.html#%E9%A2%84%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D%E5%88%97%E8%A1%A8)。
   */
  hosts?: Record<string, string | string[]>;
  /**
   * DNS 服务器列表，支持的类型有两种：DNS 地址（字符串形式）和 `DnsServerObject`。
   *
   * - 当值为 `"localhost"` 时，表示使用本机预设的 DNS 配置。
   * - 当它的值是一个 DNS `"IP:Port"` 地址时，如 `"8.8.8.8:53"`，Xray 会使用此地址的指定 UDP 端口进行 DNS 查询。该查询遵循路由规则。不指定端口时，默认使用 53 端口。
   * - 当值是 `"tcp://host:port"` 的形式，如 `"tcp://8.8.8.8:53"`，Xray 会使用 `DNS over TCP` 进行查询。该查询遵循路由规则。不指定端口时，默认使用 53 端口。
   * - 当值是 `"tcp+local://host:port"` 的形式，如 `"tcp+local://8.8.8.8:53"`，Xray 会使用 `TCP 本地模式 (TCPL)` 进行查询。即 DNS 请求不会经过路由组件，直接通过 Freedom outbound 对外请求，以降低耗时。不指定端口时，默认使用 53 端口。
   * - 当值是 `"https://host:port/dns-query"` 的形式，如 `"https://dns.google/dns-query"`，Xray 会使用 `DNS over HTTPS` (RFC8484, 简称 DOH) 进行查询。有些服务商拥有 IP 别名的证书，可以直接写 IP 形式，比如 `https://1.1.1.1/dns-query`。也可使用非标准端口和路径，如 `"https://a.b.c.d:8443/my-dns-query"`
   * - 当值是 `"https+local://host:port/dns-query"` 的形式，如 `"https+local://dns.google/dns-query"`，Xray 会使用 `DOH 本地模式 (DOHL)` 进行查询，即 DOH 请求不会经过路由组件，直接通过 Freedom outbound 对外请求，以降低耗时。一般适合在服务端使用。也可使用非标端口和路径。
   * - 当值是 `"quic+local://host"` 的形式，如 `"quic+local://dns.adguard.com"`，Xray 会使用 `DNS over QUIC 本地模式 (DOQL)` 进行查询，即 DNS 请求不会经过路由组件，直接通过 Freedom outbound 对外请求。该方式需要 DNS 服务器支持 DNS over QUIC。默认使用 784 端口进行查询，可以使用非标端口。
   * - 当值是 `fakedns` 时，将使用 FakeDNS 功能进行查询。
   */
  servers: (string | ServerObject)[];
  /** 用于 DNS 查询时通知服务器以指定 IP 位置。不能是私有地址。 */
  clientIp?: string;
  /** `UseIPv4` 只查询 A 记录；`UseIPv6` 只查询 AAAA 记录。默认值为 `UseIP`，即查询 A 和 AAAA 记录。 */
  queryStrategy?: 'UseIP' | 'UseIPv4' | 'UseIPv6';
  /** `true` 禁用 DNS 缓存，默认为 `false`，即不禁用。 */
  disableCache?: boolean;
  /** `true` 禁用 DNS 的 fallback 查询，默认为 `false`，即不禁用。 */
  disableFallback?: boolean;
  /** `true` 当 DNS 服务器的优先匹配域名列表命中时，禁用 fallback 查询，默认为 `false`，即不禁用。 */
  disableFallbackIfMatch?: boolean;
  /** 由内置 DNS 发出的查询流量，除 `localhost`、`fakedns`、`TCPL`、`DOHL` 和 `DOQL` 模式外，都可以用此标识在路由使用 `inboundTag` 进行匹配。 */
  tag?: string;
}
