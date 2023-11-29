import BlackholeOutboundConfigurationObject from './outbounds/blackhole';
import FreedomOutboundConfigurationObject from './outbounds/freedom';
import ShadowsocksOutboundConfigurationObject from './outbounds/shadowsocks';
import TrojanOutboundConfigurationObject from './outbounds/trojan';
import VLESSOutboundConfigurationObject from './outbounds/vless';
import VMessOutboundConfigurationObject from './outbounds/vmess';
import { StreamSettingsObject } from './transports';

interface ProxySettingsObject {
  /** 当指定另一个 outbound 的标识时，此 outbound 发出的数据，将被转发至所指定的 outbound 发出。 */
  tag: string;
}

interface MuxObject {
  /** 是否启用 Mux 转发请求，默认值 `false`。 */
  enabled?: boolean;
  /** 最大并发连接数。最小值 `1`，最大值 `1024`。省略或者填 `0` 时都等于 `8`。 */
  concurrency?: number;
  /** 使用新 XUDP 聚合隧道（也就是另一条 Mux 连接）代理 UDP 流量，填写最大并发子 UoT 数量。最小值 `1`，最大值 `1024`。 */
  xudpConcurrency?: number;
  /**
   * 控制 Mux 对于被代理的 UDP/443（QUIC）流量的处理方式：
   *
   * - 默认 `reject` 拒绝流量（一般浏览器会自动回落到 TCP HTTP2）
   * - `allow` 允许走 Mux 连接。
   * - 填 `skip` 时，不使用 Mux 模块承载 UDP 443 流量。将使用代理协议原本的 UDP 传输方式。例如 `Shadowsocks` 会使用原生 UDP，`VLESS` 会使用 UoT。
   */
  xudpProxyUDP443?: 'reject' | 'allow' | 'skip';
}

interface CommonOutboundObject {
  /** 用于发送数据的 IP 地址，当主机有多个 IP 地址时有效，默认值为 `"0.0.0.0"`。 */
  sendThrough?: string;
  /** 此出站连接的标识，用于在其它的配置中定位此连接。当其不为空时，其值必须在所有 `tag` 中**唯一**。 */
  tag?: string;
  /** 底层传输方式（transport）是当前 Xray 节点和其它节点对接的方式。 */
  streamSettings?: StreamSettingsObject;
  /** 出站代理配置。 */
  proxySettings?: ProxySettingsObject;
  /** Mux 相关的具体配置。 */
  mux?: MuxObject;
}

/** 出站连接配置 */
type OutboundObject = CommonOutboundObject &
  (
    | BlackholeOutboundConfigurationObject
    | FreedomOutboundConfigurationObject
    | ShadowsocksOutboundConfigurationObject
    | TrojanOutboundConfigurationObject
    | VLESSOutboundConfigurationObject
    | VMessOutboundConfigurationObject
  );

export default OutboundObject;
