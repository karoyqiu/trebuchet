/** 基于 gRPC 的传输方式。 */
export default interface GRPCOBject {
  /** 一个字符串，指定服务名称，类似于 HTTP/2 中的 Path。 客户端会使用此名称进行通信，服务端会验证服务名称是否匹配。 */
  serviceName: string;
  /** `true` 启用 `multiMode`，默认值为： `false`。 */
  multiMode?: boolean;
  /** 设置 gRPC 的用户代理，可能能防止某些 CDN 阻止 gRPC 流量。以下字段只需在出站（客户端）配置。 */
  user_agent?: string;
  /** 单位秒，当这段时间内没有数据传输时，将会进行健康检查。如果此值设置为 `10` 以下，将会使用 `10`，即最小值。健康检查默认**不启用**。 */
  idle_timeout?: number;
  /** 单位秒，健康检查的超时时间。如果在这段时间内没有完成健康检查，且仍然没有数据传输时，即认为健康检查失败。默认值为 `20`。 */
  health_check_timeout?: number;
  /** `true` 允许在没有子连接时进行健康检查。默认值为 `false`。 */
  permit_without_stream?: boolean;
  /** h2 Stream 初始窗口大小。当值小于等于 `0` 时，此功能不生效。当值大于 `65535` 时，动态窗口机制（Dynamic Window）会被禁用。默认值为 `0`，即不生效。 */
  initial_windows_size?: number;
}
