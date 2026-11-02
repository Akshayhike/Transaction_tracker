import {format} from 'date-fns';

type TransactionType = "Income" | "Expense"

type addTranscationsProps = {
  Description: string;
  Amount: number
  Category: string;
  Date: Date;
  Type: TransactionType;
}
function AddTransaction(props:addTranscationsProps) {
  return (
    <form className="AddTransaction" onSubmit={(event) => event.preventDefault()}>
      <h2>Add transaction</h2>
      <label>
        Description
        <input name="description" placeholder="Description" defaultValue={props.Description} required />
      </label>
      <label>
        Amount
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" defaultValue={props.Amount || ''} required />
      </label>
      <label>
        Category
        <input name="category" placeholder="Category" defaultValue={props.Category} required />
      </label>
      <label>
        Date
        <input name="date" type="date" defaultValue={format(props.Date, 'yyyy-MM-dd')} required />
      </label>
      <label>
        Type
        <select name="type" defaultValue={props.Type}>
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
      </label>
      <button type="submit">Add</button>
    </form>
  );
}



export default AddTransaction;
