import { useState } from 'react';
import Title_Date from './components/TitleDate.js';
import Totals from './components/Totals.js';
import AddTransaction from './components/addTransaction.js';
import TransactionList from './components/TransactionList.js';
import type { NewTransaction, Transaction } from './types/transaction.js';

function Main() {
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

  function handleAddTransaction(transaction: NewTransaction) {
    setTransactions((current) => {
      const id = current.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
      return [...current, { ...transaction, id }];
    });
  }

  // Add money in cents to avoid floating-point errors such as 0.1 + 0.2.
  const totals = transactions.reduce(
    (result, transaction) => {
      const cents = Math.round(transaction.amount * 100);
      if (transaction.type === "Income") {
        result.income += cents;
      } else {
        result.expenses += cents;
      }
      return result;
    },
    { income: 0, expenses: 0 },
  );

  return (
    <div>
      <Title_Date title="Expense Tracker" date={new Date()} />
      <Totals
        income={totals.income / 100}
        expenses={totals.expenses / 100}
        balance={(totals.income - totals.expenses) / 100}
      />
      <AddTransaction onAdd={handleAddTransaction} />
      <TransactionList title="Transactions" transactionList={transactions} />
    </div>
  );
}

export default Main;
