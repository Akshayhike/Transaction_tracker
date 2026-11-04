import { useState } from 'react';
import type { FormEvent } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import type { NewTransaction, Transaction, TransactionType } from '../types/transaction.js';

type AddTransactionProps = {
  onAdd: (transaction: NewTransaction) => void;
  editingTransaction: Transaction | null;
  onSave: (id: number, transaction: NewTransaction) => void;
  onCancel: () => void;
};

function AddTransaction({ onAdd, editingTransaction, onSave, onCancel }: AddTransactionProps) {
  const [description, setDescription] = useState(editingTransaction?.description ?? "");
  const [amount, setAmount] = useState(editingTransaction ? String(editingTransaction.amount) : "");
  const [category, setCategory] = useState(editingTransaction?.category ?? "");
  const [date, setDate] = useState(() => format(editingTransaction?.date ?? new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<TransactionType>(editingTransaction?.type ?? "Expense");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    // parseISO treats a date-only value as a local date, avoiding a UTC day shift.
    const transactionDate = parseISO(date);

    if (!description.trim() || !category.trim()) {
      setError("Enter a description and category.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !Number.isSafeInteger(Math.round(numericAmount * 100))) {
      setError("Enter a positive amount within the supported range.");
      return;
    }
    if (!isValid(transactionDate)) {
      setError("Choose a valid date.");
      return;
    }

    const transaction: NewTransaction = {
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
      category: category.trim(),
      date: transactionDate,
      type,
    };
    if (editingTransaction) {
      onSave(editingTransaction.id, transaction);
      return;
    }
    onAdd(transaction);
    setDescription("");
    setAmount("");
    setCategory("");
    setError("");
  }

  return (
    <form className="AddTransaction" onSubmit={handleSubmit}>
      <h2>{editingTransaction ? "Edit transaction" : "Add transaction"}</h2>
      <label>
        Description
        <input autoFocus={Boolean(editingTransaction)} name="description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
      </label>
      <label>
        Amount
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} required />
      </label>
      <label>
        Category
        <input name="category" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} required />
      </label>
      <label>
        Date
        <input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </label>
      <label>
        Type
        <select name="type" value={type} onChange={(event) => setType(event.target.value === "Income" ? "Income" : "Expense")}>
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
      </label>
      <div className="form-actions">
        <button type="submit">{editingTransaction ? "Save changes" : "Add"}</button>
        {editingTransaction ? <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button> : null}
      </div>
      {error ? <p role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p> : null}
    </form>
  );
}

export default AddTransaction;
