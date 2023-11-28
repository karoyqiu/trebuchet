/** API 接口配置 */
export default interface ApiObject {
  /** 出站代理标识。 */
  tag: string;
  /** 开启的 API 列表 */
  services: ('HandlerService' | 'LoggerService' | 'StatsService')[];
}
