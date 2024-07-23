import Dexie, { Table } from 'dexie';
import type Endpoint from './endpoint';
import type FlowLog from './flowLog';
import type LogEntry from './logEntry';
import type { Subscription } from './subscription';
import type { Website } from './website';

class Database extends Dexie {
  subs!: Table<Subscription, number>;
  endpoints!: Table<Endpoint, string>;
  flowLogs!: Table<FlowLog, number>;
  logEntries!: Table<LogEntry, number>;
  websites!: Table<Website, number>;

  constructor() {
    super('db');

    this.version(5)
      .stores({
        subs: '++id, &name, &url',
        endpoints: '[host+port], &id, subId',
        flowLogs: 'ts',
        logEntries: '++id',
        websites: '++id',
      })
      .upgrade((tx) =>
        tx.table<Website, number>('websites').add({
          name: 'Google',
          url: 'https://www.google.com/generate_204',
        }),
      );
  }
}

const db = new Database();
export default db;
