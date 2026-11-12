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
    if (options.signal?.aborted) throw error;
    throw new Error('Could not reach the tracker server. Check that it is running, then try again.');
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status}). Try again.`);
  if (body === null) throw new Error('The server returned an unexpected response. Try again.');
  return body as T;
}

function fromApi(transaction: ApiTransaction): Transaction {
  // Parse the saved calendar date locally to preserve the day in every timezone.
  const date = parseISO(transaction.date);
  if (!isValid(date)) throw new Error('The server returned a transaction with an invalid date.');
  return { ...transaction, date };
}

function toApi(transaction: NewTransaction) {
  return JSON.stringify({ ...transaction, date: format(transaction.date, 'yyyy-MM-dd') });
}

export async function fetchTransactions(signal: AbortSignal): Promise<Transaction[]> {
  const timeoutSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const transactions = await request<ApiTransaction[]>(baseUrl, { signal: timeoutSignal });
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
