/** 使用标准的 Unix domain socket 来传输数据。 */
export default interface DomainSocketObject {
  /** 一个合法的文件路径。在运行 Xray 之前，这个文件必须不存在。 */
  path: string;
  /** 是否为 abstract domain socket，默认值 `false`。 */
  abstract?: boolean;
  /** abstract domain socket 是否带 padding，默认值 `false`。 */
  padding?: boolean;
}
