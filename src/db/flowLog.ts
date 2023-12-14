/** 流量记录 */
export default interface FlowLog {
  /** 时间戳，ID */
  ts: number;
  /** 下载速度，字节/秒 */
  download: number;
  /** 上传速度，字节/秒 */
  upload: number;
}
