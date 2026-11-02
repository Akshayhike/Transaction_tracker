type TotalsProps = {
  income: number;
  expenses: number;
  balance: number;
}

// Displays the totals of transactions.
function Totals(props:TotalsProps) {
  return (
    <div className="Totals" style={{background: 'lightblue'}}>
      <h2>Income</h2>
      <div>{props.income}</div>
      <h2>Expenses</h2>
      <div>{props.expenses}</div>
      <h2>Balance</h2>
      <div>{props.balance}</div>
    </div>
  );
}

export default Totals;