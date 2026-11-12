import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const defaultPath = fileURLToPath(new URL('../data/transactions.sqlite', import.meta.url));
const databasePath = process.env.TRACKER_DB_PATH ?? defaultPath;
if (databasePath !== ':memory:') mkdirSync(dirname(resolve(databasePath)), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec('PRAGMA busy_timeout = 5000');
database.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

// The API uses decimal amounts. SQLite stores integer cents for exact storage.
const columns = 'id, description, category, amount_cents / 100.0 AS amount, date, type';
const list = database.prepare(`SELECT ${columns} FROM transactions ORDER BY id`);
const get = database.prepare(`SELECT ${columns} FROM transactions WHERE id = ?`);
const insert = database.prepare(`
  INSERT INTO transactions (description, category, amount_cents, date, type)
  VALUES (?, ?, ?, ?, ?) RETURNING ${columns}
`);
const update = database.prepare(`
  UPDATE transactions SET description = ?, category = ?, amount_cents = ?, date = ?, type = ?
  WHERE id = ? RETURNING ${columns}
`);
const remove = database.prepare('DELETE FROM transactions WHERE id = ?');

function values(transaction) {
  return [transaction.description, transaction.category, Math.round(transaction.amount * 100), transaction.date, transaction.type];
}

export function listTransactions() { return list.all(); }
export function getTransaction(id) { return get.get(id); }
export function createTransaction(transaction) { return insert.get(...values(transaction)); }
export function updateTransaction(id, transaction) { return update.get(...values(transaction), id); }
export function deleteTransaction(id) { return remove.run(id); }
export function closeDatabase() { database.close(); }
