// Export the types of data to use
export type TransactionType = "Income" | "Expense";

export type Transaction = {
  id: number;
  description: string;
  category: string;
  date: Date;
  amount: number;
  type: TransactionType;
};

export type NewTransaction = Omit<Transaction, "id">;
