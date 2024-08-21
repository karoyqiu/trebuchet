import { entity } from 'simpler-state';
import { dbCountLogs, dbQueryLogs } from '../api/bindings';

export type { Log as LogEntry } from '../api/bindings';

export const logs = entity(dbQueryLogs());
export const logCount = entity(dbCountLogs());

export const reloadLogs = async () => {
  const [items, count] = await Promise.all([dbQueryLogs(), dbCountLogs()]);
  logs.set(items);
  logCount.set(count);
};
