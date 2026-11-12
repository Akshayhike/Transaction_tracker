import { useState } from 'react';
import type { FormEvent } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import type { NewTransaction, Transaction, TransactionType } from '../types/transaction.js';

// AddTransactionProps is the props for the AddTransaction component
type AddTransactionProps = {
  onAdd: (transaction: NewTransaction) => Promise<void>;
  busy: boolean;
  editingTransaction: Transaction | null;
  onSave: (id: number, transaction: NewTransaction) => Promise<void>;
  onCancel: () => void;
};

function AddTransaction({ onAdd, editingTransaction, onSave, onCancel, busy }: AddTransactionProps) {
  // States for the form fields. If editingTransaction is provided, use the values from the editingTransaction.
  const [description, setDescription] = useState(editingTransaction?.description ?? "");
  const [amount, setAmount] = useState(editingTransaction ? String(editingTransaction.amount) : "");
  const [category, setCategory] = useState(editingTransaction?.category ?? "");
  const [date, setDate] = useState(() => format(editingTransaction?.date ?? new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<TransactionType>(editingTransaction?.type ?? "Expense");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const numericAmount = Number(amount);
    // parseISO treats a date-only value as a local date, avoiding a UTC day shift.
    const transactionDate = parseISO(date);

    // If the description or category is empty, set the error message.
    if (!description.trim() || !category.trim()) {
      setError("Enter a description and category.");
      return;
    }

    // If the amount is not a finite number, not positive, or not a safe integer, set the error message.
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !Number.isSafeInteger(Math.round(numericAmount * 100))) {
      setError("Enter a positive amount within the supported range.");
      return;
    }

    // If the date is not a valid date, set the error message.
    if (!isValid(transactionDate)) {
      setError("Choose a valid date.");
      return;
    }

    // Create the transaction object.
    const transaction: NewTransaction = {
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
      category: category.trim(),
      date: transactionDate,
      type,
    };

    // Only clear the draft after the server confirms that it was saved.
    try {
      if (editingTransaction) {
        await onSave(editingTransaction.id, transaction);
      } else {
        await onAdd(transaction);
        setDescription("");
        setAmount("");
        setCategory("");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save this transaction. Try again.');
    }
  }

  // Renders the AddTransaction form.
  return (
    <form className="AddTransaction" onSubmit={handleSubmit}>
      <h2>{editingTransaction ? "Edit transaction" : "Add transaction"}</h2>
      <label>
        Description
        <input disabled={busy} autoFocus={Boolean(editingTransaction)} name="description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
      </label>
      <label>
        Amount
        <input disabled={busy} name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} required />
      </label>
      <label>
        Category
        <input disabled={busy} name="category" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} required />
      </label>
      <label>
        Date
        <input disabled={busy} name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </label>
      <label>
        Type
        <select disabled={busy} name="type" value={type} onChange={(event) => setType(event.target.value === "Income" ? "Income" : "Expense")}>
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
      </label>
      <div className="form-actions">
        <button disabled={busy} type="submit">{busy ? "Please wait…" : editingTransaction ? "Save changes" : "Add"}</button>
        {editingTransaction ? <button disabled={busy} className="secondary-button" type="button" onClick={onCancel}>Cancel</button> : null}
      </div>
      {error ? <p role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p> : null}
    </form>
  );
}

export default AddTransaction;
