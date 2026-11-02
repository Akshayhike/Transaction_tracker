import {format} from 'date-fns'

type TranscationsProps = {
  key: number;
  id: number;
  Description: string; 
  Category: string;
  Date: Date;
  Amount: number;
  Type: string
}
function TransactionItem(props: TranscationsProps) {
  return (
    <div className="Transcations">
      <p className="id">{props.id}</p>
      <h2>{props.Description}</h2>
      <p className="category">{props.Category}</p>
      <p className="date">{format(props.Date, 'dd MMM yyyy')}</p>
      <p className="amount">{props.Amount}</p>
      <p className="type">{props.Type}</p>
    </div>
  );
}

export default TransactionItem;
