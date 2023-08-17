/** 节点 */
export interface Endpoint {
  id: string;
  /** 类型，vmess, shadowsocks 等等 */
  protocol: string;
  /** 名称 */
  name: string;
  /** 地址 */
  host: string;
  /** 端口 */
  port: number;
  /** 加密方式 */
  cipher?: string;
  /** 传输协议 */
  transport?: string;
  /** 订阅分组名称 */
  sub: string;
  /** 延迟，毫秒 */
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
}
