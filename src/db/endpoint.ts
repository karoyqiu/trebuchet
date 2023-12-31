import OutboundObject from '../api/xray/config/outbound';
import { NetworkType } from '../api/xray/config/transports';

/** 节点 */
export default interface Endpoint {
  id: string;
  /** 名称 */
  name: string;
  /** 地址 */
  host: string;
  /** 端口 */
  port: number;
  /** 加密方式 */
  cipher?: string;
  /** 传输协议 */
  transport?: NetworkType;
  /** 订阅分组 ID */
  subId?: number;
  /** 延迟，毫秒；-1 表示正在测试 */
  latency?: number;
  /** 速度，字节/秒 */
  speed?: number;
  /** 今日上传流量，字节 */
  upload?: number;
  /** 今日下载流量，字节 */
  download?: number;
  /** 总上传流量，字节 */
  totalUpload?: number;
  /** 总下载流量，字节 */
  totalDownload?: number;
  /** 出站设置 */
  outbound: OutboundObject;
}
