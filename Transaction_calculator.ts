const transactions : Transaction[] = [
  { id: 1, description: "Part-time pay", amount: 2400, type: "income" },
  { id: 2, description: "Groceries", amount: 64.8, type: "expense" }
];
type Transaction = {
  id: number;
  description: string;
  amount: number;
  type: "income" | "expense";
};

function addTransaction(list: Transaction[],transaction: Transaction): Transaction[] {
  return [...list, transaction];
}

function removeTransaction(list: Transaction[], id: number): Transaction[] {
  return list.filter((transaction) => transaction.id !== id);
}
type Totals = {
  income: number;
  expenses: number;
  balance: number;
};

function calculateTotals(list: Transaction[]): Totals {
  return list.reduce(
    (totals, transaction) => {
      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expenses += transaction.amount;
      }

      totals.balance = totals.income - totals.expenses;
      return totals;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
}

const withNewTransaction = addTransaction(transactions, {
  id: 3,
  description: "Bus and MRT",
  amount: 18.2,
  type: "expense",
});

// const updatedTransactions = removeTransaction(withNewTransaction, 2);

console.log(withNewTransaction);
console.log(calculateTotals(withNewTransaction));