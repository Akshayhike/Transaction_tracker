import { useState } from 'react';
import type { FormEvent } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import type { NewTransaction, TransactionType } from '../types/transaction.js';

type AddTransactionProps = {
  onAdd: (transaction: NewTransaction) => void;
};

function AddTransaction({ onAdd }: AddTransactionProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<TransactionType>("Expense");
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

    onAdd({
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
      category: category.trim(),
      date: transactionDate,
      type,
    });
    setDescription("");
    setAmount("");
    setCategory("");
    setError("");
  }

  return (
    <form className="AddTransaction" onSubmit={handleSubmit}>
      <h2>Add transaction</h2>
      <label>
        Description
        <input name="description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
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
      <button type="submit">Add</button>
      {error ? <p role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p> : null}
    </form>
  );
}

export default AddTransaction;
