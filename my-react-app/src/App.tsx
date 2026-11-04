import { useState } from 'react';
import Title_Date from './components/TitleDate.js';
import Totals from './components/Totals.js';
import AddTransaction from './components/addTransaction.js';
import TransactionList from './components/TransactionList.js';
import CategorySummary from './components/CategorySummary.js';
import type { NewTransaction, Transaction, TransactionType } from './types/transaction.js';

function Main() {
  // Sets the state for transactions.
  const [transactions, setTransactions] = useState<Transaction[]>(() => [
    {
      id: 1,
      description: "Groceries",
      category: "Food",
      date: new Date(),
      amount: 2000,
      type: "Expense",
    },
  ]);

  // The search, filter, and editing states.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("");

  const editingTransaction = transactions.find((item) => item.id === editingId) ?? null;

  function handleAddTransaction(transaction: NewTransaction) {
    setTransactions((current) => {
      const id = current.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
      return [...current, { ...transaction, id }];
    });
  }

  function handleSaveTransaction(id: number, transaction: NewTransaction) {
    // map replaces the selected row while keeping its ID and the other rows.
    setTransactions((current) => current.map((item) => item.id === id ? { ...transaction, id } : item));
    setEditingId(null);
  }

  function handleDeleteTransaction(id: number) {
    setTransactions((current) => current.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
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
      <div className="totals-section">
        <p className="summary-scope">Totals for all transactions</p>
        <Totals income={totals.income / 100} expenses={totals.expenses / 100} balance={(totals.income - totals.expenses) / 100} />
      </div>
      <AddTransaction
        key={editingTransaction?.id ?? "new"}
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
        <TransactionList
          title="Transactions"
          transactionList={filteredTransactions}
          hasFilters={hasFilters}
          onEdit={setEditingId}
          onDelete={handleDeleteTransaction}
        />
      </section>
      <CategorySummary transactions={transactions} />
    </div>
  );
}

export default Main;
