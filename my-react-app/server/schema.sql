CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  category TEXT NOT NULL CHECK (length(trim(category)) > 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 9007199254740991),
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense'))
) STRICT;
