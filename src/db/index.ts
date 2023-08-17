import Dexie, { Table } from 'dexie';
import { Subscription } from './subscription';

class Database extends Dexie {
  subs!: Table<Subscription>;

  constructor() {
    super('db');

    this.version(1).stores({
      subs: '++id',
    });
  }
}

const db = new Database();
export default db;
