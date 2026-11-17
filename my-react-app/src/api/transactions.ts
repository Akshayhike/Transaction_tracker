import { format, isValid, parseISO } from 'date-fns';
import type { NewTransaction, Transaction } from '../types/transaction.js';

type ApiTransaction = Omit<Transaction, 'date'> & { date: string };
const baseUrl = '/api/transactions';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The request took too long. Please try again.');
    }
    if (options.signal?.aborted) throw error;
    throw new Error('Could not reach the tracker server. Check that it is running, then try again.');
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status}). Try again.`);
  if (body === null) throw new Error('The server returned an unexpected response. Try again.');
  return body as T;
}

function fromApi(value: unknown): Transaction {
  const invalidData = 'The server returned invalid transaction data. Please retry loading.';
  if (typeof value !== 'object' || value === null) throw new Error(invalidData);
  const transaction = value as Partial<ApiTransaction>;
  if (
    typeof transaction.id !== 'number' || !Number.isSafeInteger(transaction.id) || transaction.id <= 0 ||
    typeof transaction.description !== 'string' || !transaction.description.trim() ||
    typeof transaction.category !== 'string' || !transaction.category.trim() ||
    typeof transaction.amount !== 'number' || transaction.amount <= 0 ||
    !Number.isSafeInteger(Math.round(transaction.amount * 100)) ||
    Number(transaction.amount.toFixed(2)) !== transaction.amount ||
    (transaction.type !== 'Income' && transaction.type !== 'Expense') ||
    typeof transaction.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
  ) {
    throw new Error(invalidData);
  }

  // Parse the saved calendar date locally to preserve the day in every timezone.
  const date = parseISO(transaction.date);
  if (!isValid(date)) throw new Error(invalidData);
  return {
    id: transaction.id,
    description: transaction.description,
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type,
    date,
  };
}

function toApi(transaction: NewTransaction) {
  return JSON.stringify({ ...transaction, date: format(transaction.date, 'yyyy-MM-dd') });
}

export async function fetchTransactions(signal: AbortSignal): Promise<Transaction[]> {
  const timeoutSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const transactions = await request<unknown>(baseUrl, { signal: timeoutSignal });
  if (!Array.isArray(transactions)) {
    throw new Error('The server returned an invalid transaction list. Please retry loading.');
  }
  return transactions.map(fromApi);
}

export async function createTransaction(transaction: NewTransaction): Promise<Transaction> {
  return fromApi(await request<ApiTransaction>(baseUrl, { method: 'POST', body: toApi(transaction) }));
}

export async function updateTransaction(id: number, transaction: NewTransaction): Promise<Transaction> {
  return fromApi(await request<ApiTransaction>(`${baseUrl}/${id}`, { method: 'PUT', body: toApi(transaction) }));
}

export async function deleteTransaction(id: number): Promise<void> {
  await request<void>(`${baseUrl}/${id}`, { method: 'DELETE' });
}
