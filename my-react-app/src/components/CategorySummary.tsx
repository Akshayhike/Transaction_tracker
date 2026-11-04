import type { Transaction } from '../types/transaction.js';

// CategorySummaryProps is the props for the CategorySummary component
type CategorySummaryProps = {
  transactions: Transaction[];
};

function CategorySummary({ transactions }: CategorySummaryProps) {
  // grouped is a map of category name to a object with the name and cents
  const grouped = new Map<string, { name: string; cents: number }>();
  // totalCents is the total amount of money spent
  let totalCents = 0;

  // Uses a for-loop to iterate and get the grouped expenses.
  for (const transaction of transactions) {
    
    // skips if transaction is not an expense
    if (transaction.type !== "Expense") continue;
    
    // key = category name in lowercase
    const key = transaction.category.toLowerCase();

    // if category exists in grouped, add to it, else create a new one
    const category = grouped.get(key) ?? { name: transaction.category, cents: 0 };

    // calculations done for money spent per category and the total money spent.
    const cents = Math.round(transaction.amount * 100);
    category.cents += cents;
    totalCents += cents;
    grouped.set(key, category);
  }

  // categories is an array of [category name, category object] sorted by cents in descending order
  const categories = [...grouped].sort((a, b) => b[1].cents - a[1].cents || a[1].name.localeCompare(b[1].name));

  // returns the html for the section with the category summary, sorted by cents in descending order.
  return (
    <section className="category-summary" aria-labelledby="category-summary-title">
      <h2 id="category-summary-title">Spending by category</h2>
      <p className="summary-scope">All expense transactions, including those hidden by filters.</p>
      {categories.length === 0 ? <p>No expenses yet.</p> : (
        <ul>
          {categories.map(([key, category]) => (
            <li key={key}>
              <div className="category-summary-row">
                <span>{category.name}</span>
                <strong>{(category.cents / 100).toFixed(2)}</strong>
              </div>
              <progress value={category.cents} max={totalCents} aria-label={`${category.name} share of expenses`} />
              <small>{(category.cents / totalCents * 100).toFixed(1)}% of expenses</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CategorySummary;
