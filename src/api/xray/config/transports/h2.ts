/** 基于 HTTP/2 的传输方式。 */
export default interface HttpObject {
  /** 一个字符串数组，每一个元素是一个域名。 */
  host: string[];
  /** HTTP 路径，由 `/` 开头, 客户端和服务器必须一致。默认值为 `"/"`。 */
  path?: string;
  /** HTTP 方法。默认值为 `"PUT"`。 */
  method?: string;
  /** HTTP 头，一个键值对，每个键表示一个 HTTP 头的名称，对应的值是一个数组。 */
  headers?: Record<string, string[]>;
  /** 单位秒，当这段时间内没有数据传输时，将会进行健康检查。健康检查默认**不启用**。 */
  read_idle_timeout?: number;
  /** 单位秒，健康检查的超时时间。如果在这段时间内没有完成健康检查，且仍然没有数据传输时，即认为健康检查失败。默认值为 `20`。 */
  health_check_timeout?: number;
}
