import Dexie, { Table } from 'dexie';
import type FlowLog from './flowLog';
import type LogEntry from './logEntry';
import type { Website } from './website';

class Database extends Dexie {
  flowLogs!: Table<FlowLog, number>;
  logEntries!: Table<LogEntry, number>;
  websites!: Table<Website, number>;

  constructor() {
    super('db');

    this.version(5)
      .stores({
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
