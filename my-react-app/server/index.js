import express from 'express';
import process from 'node:process';

const app = express();
const transactions = new Map();
let nextId = 1;

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
  if (!transactions.has(id)) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.locals.id = id;
  next();
}

app.get('/api/transactions', (_req, res) => {
  res.json([...transactions.values()]);
});

app.get('/api/transactions/:id', findTransaction, (_req, res) => {
  res.json(transactions.get(res.locals.id));
});

app.post('/api/transactions', validateTransaction, (_req, res) => {
  const transaction = { id: nextId++, ...res.locals.transaction };
  transactions.set(transaction.id, transaction);
  res.location(`/api/transactions/${transaction.id}`).status(201).json(transaction);
});

app.put('/api/transactions/:id', findTransaction, validateTransaction, (_req, res) => {
  const transaction = { id: res.locals.id, ...res.locals.transaction };
  transactions.set(transaction.id, transaction);
  res.json(transaction);
});

app.delete('/api/transactions/:id', findTransaction, (_req, res) => {
  transactions.delete(res.locals.id);
  res.status(204).end();
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
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
const server = app.listen(Number(port), '127.0.0.1', () => {
  console.log(`Transaction API listening at http://127.0.0.1:${server.address().port}`);
});
