/**
 * 路由配置
 *
 * _当多个属性同时指定时，这些属性需要**同时**满足，才可以使当前规则生效。_
 */
interface RuleObject {
  /** 域名匹配算法，根据不同的设置使用不同的算法。此处选项优先级高于 `RoutingObject` 中配置的 `domainMatcher`。 */
  domainMatcher?: 'hybrid' | 'linear';
  /** 目前只支持 `"field"` 这一个选项。 */
  type: 'field';
  /**
   * 一个数组，数组每一项是一个域名的匹配。有以下几种形式：
   *
   * - 纯字符串：当此字符串匹配目标域名中任意部分，该规则生效。比如 "sina.com" 可以匹配 "sina.com"、"sina.com.cn" 和 "www.sina.com"，但不匹配 "sina.cn"。
   * - 正则表达式：由 `"regexp:"` 开始，余下部分是一个正则表达式。当此正则表达式匹配目标域名时，该规则生效。例如 "regexp:\\\\.goo.\*\\\\.com\$" 匹配 "www.google.com" 或 "fonts.googleapis.com"，但不匹配 "google.com"。
   * - 子域名（推荐）：由 `"domain:"` 开始，余下部分是一个域名。当此域名是目标域名或其子域名时，该规则生效。例如 "domain:xray.com" 匹配 "www.xray.com"、"xray.com"，但不匹配 "wxray.com"。
   * - 完整匹配：由 `"full:"` 开始，余下部分是一个域名。当此域名完整匹配目标域名时，该规则生效。例如 "full:xray.com" 匹配 "xray.com" 但不匹配 "www.xray.com"。
   * - 预定义域名列表：由 `"geosite:"` 开头，余下部分是一个名称，如 `geosite:google` 或者 `geosite:cn`。名称及域名列表参考[预定义域名列表](https://xtls.github.io/config/routing.html#%E9%A2%84%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D%E5%88%97%E8%A1%A8)。
   * - 从文件中加载域名：形如 `"ext:file:tag"`，必须以 `ext:`（小写）开头，后面跟文件名和标签，文件存放在 [资源目录](./features/env.md#资源文件路径) 中，文件格式与 `geosite.dat` 相同，标签必须在文件中存在。
   */
  domain?: string[];
  /**
   * 一个数组，数组内每一项代表一个 IP 范围。当某一项匹配目标 IP 时，此规则生效。有以下几种形式：
   *
   * - IP：形如 `"127.0.0.1"`。
   * - [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)：形如 `"10.0.0.0/8"`。
   * - 预定义 IP 列表：此列表预置于每一个 Xray 的安装包中，文件名为 `geoip.dat`。使用方式形如 `"geoip:cn"`，必须以 `geoip:`（小写）开头，后面跟双字符国家代码，支持几乎所有可以上网的国家。
   *   - 特殊值：`"geoip:private"`，包含所有私有地址，如 `127.0.0.1`。
   * - 从文件中加载 IP：形如 `"ext:file:tag"`，必须以 `ext:`（小写）开头，后面跟文件名和标签，文件存放在 [资源目录](./features/env.md#资源文件路径) 中，文件格式与 `geoip.dat` 相同标签必须在文件中存在。
   */
  ip?: string[];
  /**
   * 目标端口范围，有三种形式：
   *
   * - `"a-b"`：a 和 b 均为正整数，且小于 65536。这个范围是一个前后闭合区间，当目标端口落在此范围内时，此规则生效。
   * - `a`：a 为正整数，且小于 65536。当目标端口为 a 时，此规则生效。
   * - 以上两种形式的混合，以逗号 "," 分隔。形如：`"53,443,1000-2000"`。
   */
  port?: number | string;
  /**
   * 来源端口范围，有三种形式：
   *
   * - `"a-b"`：a 和 b 均为正整数，且小于 65536。这个范围是一个前后闭合区间，当来源端口落在此范围内时，此规则生效。
   * - `a`：a 为正整数，且小于 65536。当来源端口为 a 时，此规则生效。
   * - 以上两种形式的混合，以逗号 "," 分隔。形如：`"53,443,1000-2000"`。
   */
  sourcePort?: number | string;
  /** 可选的值有 `"tcp"`、`"udp"` 或 `"tcp,udp"`，当连接方式是指定的方式时，此规则生效。 */
  network?: 'tcp' | 'udp' | 'tcp,udp';
  /** 一个数组，数组内每一项代表一个 IP 范围，形式有 IP、CIDR、GeoIP 和从文件中加载 IP。当某一项匹配来源 IP 时，此规则生效。 */
  source?: string[];
  /** 一个数组，数组内每一项是一个邮箱地址。当某一项匹配来源用户时，此规则生效。 */
  user?: string[];
  /** 一个数组，数组内每一项是一个标识。当某一项匹配入站协议的标识时，此规则生效。 */
  inboundTag?: string[];
  /** 一个数组，数组内每一项表示一种协议。当某一个协议匹配当前连接的协议类型时，此规则生效。 */
  protocol?: ('http' | 'tls' | 'bittorrent')[];
  /** 一个 json object，键名字和值皆为字符串，用于检测流量的属性值。当 HTTP headers 包含所有指定的键，并且值包含指定的子字符串，则命中此规则。键大小写不敏感。值支持使用正则表达式。 */
  attrs?: Record<string, string>;
  /** 对应一个 outbound 的标识。 */
  outboundTag?: string;
  /** 对应一个 Balancer 的标识。 */
  balancerTag?: string;
}

/** 负载均衡器配置。当一个负载均衡器生效时，它会从指定的 outbound 中，按配置选出一个最合适的 outbound，进行流量转发。 */
interface BalancerObject {
  /** 此负载均衡器的标识，用于匹配 `RuleObject` 中的 `balancerTag`。 */
  tag: string;
  /**
   * 一个字符串数组，其中每一个字符串将用于和 outbound 标识的前缀匹配。在以下几个 outbound 标识中：`[ "a", "ab", "c", "ba" ]`，`"selector": ["a"]` 将匹配到 `[ "a", "ab" ]`。
   *
   * 如果匹配到多个 outbound，负载均衡器目前会从中随机选出一个作为最终的 outbound。
   */
  selector: string[];
}

/** 路由 */
export default interface RoutingObject {
  /**
   * 域名解析策略，根据不同的设置使用不同的策略。
   *
   * - `"AsIs"`：只使用域名进行路由选择。默认值。
   * - `"IPIfNonMatch"`：当域名没有匹配任何规则时，将域名解析成 IP（A 记录或 AAAA 记录）再次进行匹配；
   *   - 当一个域名有多个 A 记录时，会尝试匹配所有的 A 记录，直到其中一个与某个规则匹配为止；
   *   - 解析后的 IP 仅在路由选择时起作用，转发的数据包中依然使用原始域名；
   * - `"IPOnDemand"`：当匹配时碰到任何基于 IP 的规则，将域名立即解析为 IP 进行匹配；
   */
  domainStrategy?: 'AsIs' | 'IPIfNonMatch' | 'IPOnDemand';
  /**
   * 域名匹配算法，根据不同的设置使用不同的算法。此处选项会影响所有未单独指定匹配算法的 `RuleObject`。
   *
   * - `"hybrid"`：使用新的域名匹配算法，速度更快且占用更少。默认值。
   * - `"linear"`：使用原来的域名匹配算法。
   */
  domainMatcher?: 'hybrid' | 'linear';
  /**
   * 对应一个数组，数组中每一项是一个规则。
   *
   * 对于每一个连接，路由将根据这些规则从上到下依次进行判断，当遇到第一个生效规则时，即将这个连接转发至它所指定的 outboundTag 或 balancerTag。
   */
  rules: RuleObject[];
  /**
   * 一个数组，数组中每一项是一个负载均衡器的配置。
   *
   * 当一个规则指向一个负载均衡器时，Xray 会通过此负载均衡器选出一个 outbound, 然后由它转发流量。
   */
  balancers?: BalancerObject[];
}
