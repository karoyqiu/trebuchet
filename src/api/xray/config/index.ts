import ApiObject from './api';
import DnsObject from './dns';
import InboundObject from './inbound';
import LogObject from './log';
import OutboundObject from './outbound';
import PolicyObject from './policy';
import RoutingObject from './routing';
import StatsObject from './stats';
import { TransportObject } from './transports';

/** Xray 的配置文件 */
export default interface ConfigObject {
  /** 日志配置，控制 Xray 输出日志的方式。 */
  log?: LogObject;
  /** 提供了一些 API 接口供远程调用。 */
  api?: ApiObject;
  /** 内置的 DNS 服务器。如果没有配置此项，则使用系统的 DNS 设置。 */
  dns?: DnsObject;
  /** 路由功能。可以设置规则分流数据从不同的 outbound 发出。 */
  routing?: RoutingObject;
  /** 本地策略，可以设置不同的用户等级和对应的策略设置。 */
  policy?: PolicyObject;
  /** 一个数组，每个元素是一个入站连接配置。 */
  inbounds: InboundObject[];
  /** 一个数组，每个元素是一个出站连接配置。 */
  outbounds: OutboundObject[];
  /** 用于配置 Xray 其它服务器建立和使用网络连接的方式。 */
  transport?: TransportObject;
  /** 用于配置流量数据的统计。 */
  stats?: StatsObject;
}
