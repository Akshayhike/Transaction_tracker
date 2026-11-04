import TransactionItem from "./TransactionsItem.js";
import type { Transaction } from "../types/transaction.js";

// Defining the props for the TransactionList component.
type TransactionListProps = {
  title: string;
  transactionList: Transaction[];
  hasFilters: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

// Rendering the TransactionList component.
function TransactionList({ title, transactionList, hasFilters, onEdit, onDelete }: TransactionListProps) {
  // Distinguish an empty tracker from filters that match no transactions.
  return (
    <div className="TranscationList">
      <h2>{title}</h2>
      {transactionList.length === 0 ? (
        <p>{hasFilters ? "No transactions match your filters." : "No transactions yet"}</p>
      ) : (
        transactionList.map((item) => <TransactionItem key={item.id} {...item} onEdit={onEdit} onDelete={onDelete} />)
      )}
    </div>
  );
}

// export for use
export default TransactionList;
