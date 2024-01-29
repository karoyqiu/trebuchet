import { entity, persistence } from 'simpler-state';

interface Settings {
  /** SOCKS 侦听端口 */
  socksPort: number;
  /** HTTP 侦听端口 */
  httpPort: number;
  /** 是否允许局域网连接 */
  allowLan?: boolean;
  /** 订阅自动更新间隔，分钟 */
  subUpdateInterval: number;
  /** 节点自动测速间隔，分钟 */
  epTestInterval: number;
  /** 节点测速并发量 */
  epTestConcurrency: number;
}

const defaultSettings: Settings = {
  socksPort: 1089,
  httpPort: 1090,
  // 1 小时更新一次
  subUpdateInterval: 60,
  epTestInterval: 3,
  epTestConcurrency: 32,
};

const settings = entity(defaultSettings, [persistence('settings')]);

export const useSettings = () => settings.use();

const changeSettings = (value: Settings, change: Partial<Settings>) => ({ ...value, ...change });
export const updateSettings = (change: Partial<Settings>) => settings.set(changeSettings, change);

export default settings;
