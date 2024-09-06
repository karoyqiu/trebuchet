import { entity } from 'simpler-state';
import { dbGetSettings, dbSetSettings, type Settings } from './bindings';

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

const settings = entity(dbGetSettings());

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

export const updateSettings = async (change: Partial<Settings>) => {
  const s = getSettings();
  const merged = { ...s, ...change };
  await dbSetSettings(merged);

  settings.set(merged);
};

export default settings;
