export type Currency = "EUR" | "USD" | "BRL" | "GBP" | "JPY";
export type AccountRole = "OWNER" | "ADMIN" | "MEMBER";

export type AccountMember = {
  userId: string;
  role: AccountRole;
  user: {
    id?: string;
    name: string;
    image: string;
    email?: string;
  };
};

export type AccountCounts = {
  transactions: number;
  savingGoals: number;
};

export type AccountSummary = {
  id: string;
  name: string;
  description?: string | null;
  currency: Currency;
  updatedAt: string | Date;
  users?: AccountMember[];
  _count?: AccountCounts;
};

export type AccountDetail = {
  id: string;
  name: string;
  description?: string | null;
  currency: Currency;
  createdAt: string | Date;
  updatedAt: string | Date;
  users: AccountMember[];
  transactions: Transaction[];
  savingGoals: savingGoal[];
  _count: AccountCounts;
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  notes?: string | null;
  date: string | Date;
  createdBy: { name: string; image: string };
};

export type savingGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | Date | null;
  notes?: string | null;
};
