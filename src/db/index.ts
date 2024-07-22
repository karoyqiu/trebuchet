import Dexie, { Table } from 'dexie';
import type Endpoint from './endpoint';
import type FlowLog from './flowLog';
import type LogEntry from './logEntry';
import type { Subscription } from './subscription';

class Database extends Dexie {
  subs!: Table<Subscription, number>;
  endpoints!: Table<Endpoint, string>;
  flowLogs!: Table<FlowLog, number>;
  logEntries!: Table<LogEntry, number>;

  constructor() {
    super('db');

    this.version(3).stores({
      subs: '++id, &name, &url',
      endpoints: '[host+port], &id, subId',
      flowLogs: 'ts',
      logEntries: '++id',
    });
  }
}

const db = new Database();
export default db;
