import { useRef } from 'react';
import { format } from 'date-fns';
import type { Transaction } from '../types/transaction.js';

type TransactionItemProps = Transaction & {
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

// Uses Transaction from the types folder to render the transaction.
function TransactionItem(props: TransactionItemProps) {
  const actionsRef = useRef<HTMLDetailsElement>(null);

  function closeActions() {
    if (actionsRef.current) actionsRef.current.open = false;
  }

  return (
    <div className="Transcations">
      <p className="id">{props.id}</p>
      <h2>{props.description}</h2>
      <p className="category">{props.category}</p>
      <p className="date">{format(props.date, 'dd MMM yyyy')}</p>
      <p className="amount">{props.amount.toFixed(2)}</p>
      <p className="type">{props.type}</p>
      <details
        className="transaction-actions"
        ref={actionsRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) closeActions();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeActions();
            actionsRef.current?.querySelector('summary')?.focus();
          }
        }}
      >
        <summary aria-label={`Actions for ${props.description}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m16 3 5 5M4 20l4-1L21 6a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
          </svg>
        </summary>
        <div className="action-options">
          <button type="button" onClick={() => { closeActions(); props.onEdit(props.id); }}>Edit</button>
          <button type="button" className="delete-action" onClick={() => { closeActions(); props.onDelete(props.id); }}>Delete</button>
        </div>
      </details>
    </div>
  );
}

export default TransactionItem;
