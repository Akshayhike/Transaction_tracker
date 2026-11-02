import TransactionItem from "./TransactionsItem.js";
import type { Transaction } from "../types/transaction.js";

// defining the props for the TransactionList component.
type TransactionListProps = {
  title: string;
  transactionList: Transaction[];
};

// Rendering the TransactionList component.
function TransactionList({ title, transactionList }: TransactionListProps) {
  
    // If no transactions, display "No transactions yet".
    // If transactions exist, display them in a list.
    return (
    <div className="TranscationList">
      <h2>{title}</h2>
      {transactionList.length === 0 ? (
        <p>No transactions yet</p>
      ) : (
        transactionList.map((item) => <TransactionItem key={item.id} {...item} />)
      )}
    </div>
  );
}
// Export the component
export default TransactionList;
