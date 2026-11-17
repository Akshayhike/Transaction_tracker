import express from 'express';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { listTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, closeDatabase } from './store.js';

const app = express();

app.use(express.json({ limit: '16kb' }));

function readTransaction(body) {
  const { description, category, amount, date, type } = body ?? {};
  if (typeof description !== 'string' || !description.trim()) return null;
  if (typeof category !== 'string' || !category.trim()) return null;
  if (type !== 'Income' && type !== 'Expense') return null;
  if (typeof amount !== 'number' || amount <= 0 ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Number(amount.toFixed(2)) !== amount) return null;

  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;

  return { description: description.trim(), category: category.trim(), amount, date, type };
}

function validateTransaction(req, res, next) {
  const transaction = readTransaction(req.body);
  if (!transaction) {
    return res.status(400).json({
      error: 'Provide a description, category, positive amount with up to two decimal places, a valid YYYY-MM-DD date, and type Income or Expense.',
    });
  }
  res.locals.transaction = transaction;
  next();
}

function findTransaction(req, res, next) {
  const id = Number(req.params.id);
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(id)) {
    return res.status(400).json({ error: 'Transaction ID must be a positive integer.' });
  }
  if (!getTransaction(id)) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.locals.id = id;
  next();
}

app.get('/api/transactions', (_req, res) => {
  res.json(listTransactions());
});

app.get('/api/transactions/:id', findTransaction, (_req, res) => {
  res.json(getTransaction(res.locals.id));
});

app.post('/api/transactions', validateTransaction, (_req, res) => {
  const transaction = createTransaction(res.locals.transaction);
  res.location(`/api/transactions/${transaction.id}`).status(201).json(transaction);
});

app.put('/api/transactions/:id', findTransaction, validateTransaction, (_req, res) => {
  const transaction = updateTransaction(res.locals.id, res.locals.transaction);
  res.json(transaction);
});

app.delete('/api/transactions/:id', findTransaction, (_req, res) => {
  deleteTransaction(res.locals.id);
  res.status(204).end();
});

// A production build can be served from the same origin as the API.
app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof URIError) {
    return res.status(400).json({ error: 'Request URL contains invalid encoding.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const port = process.env.PORT ?? 3001;
const server = app.listen(Number(port), '127.0.0.1', (error) => {
  if (error) {
    console.error('Could not start the transaction API:', error.message);
    closeDatabase();
    process.exitCode = 1;
    return;
  }
  console.log(`Transaction API listening at http://127.0.0.1:${server.address().port}`);
});

function shutdown() {
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
