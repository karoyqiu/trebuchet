import { entity, persistence } from 'simpler-state';

interface Settings {
  socksPort: number;
  httpPort: number;
  allowLan?: boolean;
}

const defaultSettings: Settings = {
  socksPort: 1089,
  httpPort: 1090,
};

export const settings = entity(defaultSettings, [persistence('settings')]);
