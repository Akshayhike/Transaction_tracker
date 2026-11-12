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

// NewTransaction is the type for a new transaction. It is the same as the Transaction type, but without the id field.
export type NewTransaction = Omit<Transaction, "id">;
