
import Title_Date from './components/TitleDate.js';
import Totals from './components/Totals.js';
import AddTransaction from './components/addTransaction.js';
import TransactionList from './components/TransactionList.js';

const transactions:any[] = [
  {
    id: 1,
    description: "Groceries",
    category: "Food",
    date: new Date(),
    amount: 2000,
    type: "Expense",
  },
];




function Main() {
  return (
    <div>
      <Title_Date title = 'Expense Tracker' date={new Date()}/>
      <Totals income = {10000} expenses = {2000} balance = {8000} />
      <AddTransaction Description="" Amount={0} Category="" Date={new Date()} Type="Expense" />
      <TransactionList title = 'Transactions' transactionList={transactions} />
    </div>
  );
}

export default Main;
