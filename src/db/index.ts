import Dexie, { Table } from 'dexie';
import type { Website } from './website';

class Database extends Dexie {
  websites!: Table<Website, number>;

  constructor() {
    super('db');

    this.version(5)
      .stores({
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
