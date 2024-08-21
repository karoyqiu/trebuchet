import { entity } from 'simpler-state';
import { dbQueryLogs } from '../api/bindings';

export type { Log as LogEntry } from '../api/bindings';

export const logs = entity(dbQueryLogs());

export const reloadLogs = async () => {
  const items = await dbQueryLogs();
  logs.set(items);
};
