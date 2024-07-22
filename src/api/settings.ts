import { entity, persistence } from 'simpler-state';
import type { RuleType } from './xray/xray';

interface Settings {
  /** SOCKS 侦听端口 */
  socksPort: number;
  /** HTTP 侦听端口 */
  httpPort: number;
  /** 是否允许局域网连接 */
  allowLan: boolean;
  /** 订阅自动更新间隔，分钟 */
  subUpdateInterval: number;
  /** 节点自动测速间隔，分钟 */
  epTestInterval: number;
  /** 节点测速并发量 */
  epTestConcurrency: number;
  /** 测试用 URL */
  epTestUrl: string;
  /** 路由规则 */
  rule: RuleType;
}

const defaultSettings = Object.freeze<Settings>({
  socksPort: 1089,
  httpPort: 1090,
  allowLan: false,
  // 1 小时更新一次
  subUpdateInterval: 60,
  epTestInterval: 3,
  epTestConcurrency: 32,
  epTestUrl: 'https://www.google.com/generate_204',
  rule: 'default',
});

const settings = entity(defaultSettings, [persistence('settings')]);

export const useSettings = () => {
  const s = settings.use();

  return {
    ...defaultSettings,
    ...s,
  };
};

export const getSettings = () => ({
  ...defaultSettings,
  ...settings.get(),
});

const changeSettings = (value: Settings, change: Partial<Settings>) => ({ ...value, ...change });
export const updateSettings = (change: Partial<Settings>) => settings.set(changeSettings, change);

export default settings;
