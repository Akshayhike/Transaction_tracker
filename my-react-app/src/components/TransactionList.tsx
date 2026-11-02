import TransactionItem from "./TransactionsItem.js";


type Transcations = {
  id: number;
  description: string; 
  category: string;
  date: Date;
  amount: number;
  type: string
}
type TranscationProps = {
  title: string;
  transactionList: Transcations[]
}

function TransactionList(props: TranscationProps) {
    let list = props.transactionList
    if (list.length === 0){
        return (
            <div className="TranscationList">
              <h2>{props.title}</h2>
              <p>No transactions yet</p>
            </div>
        )
    }
    return (
    <div className="TranscationList">
      <h2>{props.title}</h2>

      {props.transactionList.map((item) => (
        <TransactionItem 
        key = {item.id} 
        id = {item.id} 
        Description = {item.description} 
        Category = {item.category} 
        Date={item.date} 
        Amount = {item.amount} 
        Type = {item.type} />
      ))}

    </div>
  );
}

export default TransactionList;