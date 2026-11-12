import { useEffect, useRef, useState } from 'react';
import Title_Date from './components/TitleDate.js';
import Totals from './components/Totals.js';
import AddTransaction from './components/addTransaction.js';
import TransactionList from './components/TransactionList.js';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from './api/transactions.js';
import CategorySummary from './components/CategorySummary.js';
import type { NewTransaction, Transaction, TransactionType } from './types/transaction.js';

function Main() {
  // React displays the records saved by the API.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadVersion, setLoadVersion] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [saving, setSaving] = useState(false);
  const mutationLock = useRef(false);
  const busy = saving || loadState !== 'ready';

  useEffect(() => {
    const controller = new AbortController();
    fetchTransactions(controller.signal).then((records) => {
      if (controller.signal.aborted) return;
      setTransactions(records);
      setLoadState('ready');
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoadError(error instanceof Error ? error.message : 'Unable to load transactions.');
      setLoadState('error');
    });
    return () => controller.abort();
  }, [loadVersion]);

  // The search, filter, and editing states.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("");

  const editingTransaction = transactions.find((item) => item.id === editingId) ?? null;

  // A single pending operation prevents overlapping edits and duplicate clicks.
  async function runMutation(operation: () => Promise<void>) {
    if (mutationLock.current) throw new Error('Please wait for the current change to finish.');
    mutationLock.current = true;
    setSaving(true);
    setMutationError('');
    try {
      await operation();
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function handleAddTransaction(transaction: NewTransaction) {
    await runMutation(async () => {
      const saved = await createTransaction(transaction);
      setTransactions((current) => [...current, saved]);
    });
  }

  async function handleSaveTransaction(id: number, transaction: NewTransaction) {
    await runMutation(async () => {
      const saved = await updateTransaction(id, transaction);
      setTransactions((current) => current.map((item) => item.id === id ? saved : item));
      setEditingId(null);
    });
  }

  async function handleDeleteTransaction(id: number) {
    try {
      await runMutation(async () => {
        await deleteTransaction(id);
        setTransactions((current) => current.filter((item) => item.id !== id));
        if (editingId === id) setEditingId(null);
      });
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Unable to delete this transaction.');
    }
  }

  function reloadTransactions() {
    setLoadState('loading');
    setLoadError('');
    setMutationError('');
    setEditingId(null);
    setLoadVersion((current) => current + 1);
  }

  // Summaries always use the complete list; filters only change the rows shown.
  // Add money in cents to avoid floating-point errors such as 0.1 + 0.2.
  const totals = transactions.reduce(
    (result, transaction) => {
      const cents = Math.round(transaction.amount * 100);
      if (transaction.type === "Income") result.income += cents;
      else result.expenses += cents;
      return result;
    },
    { income: 0, expenses: 0 },
  );

  // Creates a map of category names.
  const categoryNames = new Map<string, string>();
  for (const transaction of transactions) {
    const key = transaction.category.toLowerCase();
    if (!categoryNames.has(key)) categoryNames.set(key, transaction.category);
  }
  // Retain an active category even if editing/deleting removes its last row.
  if (categoryFilter && !categoryNames.has(categoryFilter)) categoryNames.set(categoryFilter, categoryFilter);
  const categories = [...categoryNames].sort((a, b) => a[1].localeCompare(b[1]));
  const query = search.trim().toLowerCase();
  const filteredTransactions = transactions.filter((transaction) => (
    (transaction.description.toLowerCase().includes(query) || transaction.category.toLowerCase().includes(query)) &&
    (typeFilter === "All" || transaction.type === typeFilter) &&
    (!categoryFilter || transaction.category.toLowerCase() === categoryFilter)
  ));
  const hasFilters = Boolean(query || typeFilter !== "All" || categoryFilter);

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setCategoryFilter("");
  }

  return (
    <div>
      <Title_Date title="Expense Tracker" date={new Date()} />
      {loadState === 'loading' ? <p role="status">Loading transactions…</p> : null}
      {loadState === 'error' ? (
        <div role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={reloadTransactions}>Retry loading</button>
        </div>
      ) : null}
      {mutationError ? (
        <div role="alert">
          <p>{mutationError}</p>
          <button type="button" disabled={busy} onClick={reloadTransactions}>Reload transactions</button>
        </div>
      ) : null}
      {loadState === 'ready' ? <div className="totals-section">
        <p className="summary-scope">Totals for all transactions</p>
        <Totals income={totals.income / 100} expenses={totals.expenses / 100} balance={(totals.income - totals.expenses) / 100} />
      </div> : null}
      <AddTransaction
        key={editingTransaction?.id ?? "new"}
        busy={busy}
        onAdd={handleAddTransaction}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
        onCancel={() => setEditingId(null)}
      />
      <section className="transaction-section" aria-label="Transaction history">
        <div className="transaction-filters">
          <label>
            Search transactions
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Description or category" />
          </label>
          <label>
            Filter by type
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value === "Income" ? "Income" : event.target.value === "Expense" ? "Expense" : "All")}>
              <option value="All">All types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </label>
          <label>
            Filter by category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
        </div>
        <p className="result-count" role="status">Showing {filteredTransactions.length} of {transactions.length} transactions</p>
        {loadState === 'ready' ? <TransactionList
          title="Transactions"
          busy={busy}
          transactionList={filteredTransactions}
          hasFilters={hasFilters}
          onEdit={setEditingId}
          onDelete={handleDeleteTransaction}
        /> : null}
      </section>
      {loadState === 'ready' ? <CategorySummary transactions={transactions} /> : null}
    </div>
  );
}

export default Main;
