import { format } from 'date-fns';
import type { Transaction } from '../types/transaction.js';

// Uses transaction from the types folder to render the transactions.
function TransactionItem(props: Transaction) {
  return (
    <div className="Transcations">
      <p className="id">{props.id}</p>
      <h2>{props.description}</h2>
      <p className="category">{props.category}</p>
      <p className="date">{format(props.date, 'dd MMM yyyy')}</p>
      <p className="amount">{props.amount}</p>
      <p className="type">{props.type}</p>
    </div>
  );
}

export default TransactionItem;
