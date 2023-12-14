import Dexie, { Table } from 'dexie';
import Endpoint from './endpoint';
import FlowLog from './flowLog';
import { Subscription } from './subscription';

class Database extends Dexie {
  subs!: Table<Subscription, number>;
  endpoints!: Table<Endpoint, string>;
  flowLogs!: Table<FlowLog, number>;

  constructor() {
    super('db');

    this.version(2).stores({
      subs: '++id, &name, &url',
      endpoints: '[host+port], &id, subId',
      flowLogs: 'ts',
    });
  }
}

const db = new Database();
export default db;
