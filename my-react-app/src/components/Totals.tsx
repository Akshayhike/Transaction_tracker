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
      <div>{props.income.toFixed(2)}</div>
      <h2>Expenses</h2>
      <div>{props.expenses.toFixed(2)}</div>
      <h2>Balance</h2>
      <div>{props.balance.toFixed(2)}</div>
    </div>
  );
}

// Exports the Totals component.
export default Totals;