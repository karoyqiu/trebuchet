import Dexie, { Table } from 'dexie';
import Endpoint from './endpoint';
import { Subscription } from './subscription';

class Database extends Dexie {
  subs!: Table<Subscription, number>;
  endpoints!: Table<Endpoint, string>;

  constructor() {
    super('db');

    this.version(1).stores({
      subs: '++id, &name, &url',
      endpoints: '[host+port], &id, subId',
    });
  }
}

const db = new Database();
export default db;
