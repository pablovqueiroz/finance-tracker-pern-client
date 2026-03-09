import type { User } from "./auth.types";

export type Currency = "EUR" | "USD" | "BRL" | "GBP" | "JPY";
export type AccountRole = "OWNER" | "ADMIN" | "MEMBER";
export type DecimalValue = number | string;

export type TransactionType = "INCOME" | "EXPENSE";

export type Category =
  | "SALARY"
  | "BONUS"
  | "FREELANCE"
  | "BUSINESS_REVENUE"
  | "RENTAL_INCOME"
  | "DIVIDENDS"
  | "INTEREST"
  | "REFUNDS"
  | "GIFTS_RECEIVED"
  | "HOUSING"
  | "ELECTRICITY"
  | "WATER"
  | "GAS"
  | "HOME_INTERNET"
  | "MOBILE_PHONE"
  | "GROCERIES"
  | "RESTAURANTS_DELIVERY"
  | "TRANSPORT_FUEL"
  | "HEALTH_PHARMACY"
  | "LEISURE_HOBBIES"
  | "SUBSCRIPTIONS_STREAMING"
  | "SHOPPING"
  | "EDUCATION"
  | "PERSONAL_CARE"
  | "INVESTMENTS"
  | "DEBT_INSTALLMENTS"
  | "OTHERS";

export type AccountMember = {
  id?: string;
  userId: string;
  role: AccountRole;
  user: {
    id?: string;
    name: string;
    image: string;
    email?: string;
  };
};

export type Account = {
  name: string;
  description: string;
  currency: Currency;
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
  balance?: number;
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
  amount: DecimalValue;
  type: TransactionType;
  category: Category;
  notes?: string | null;
  date: string | Date;
  createdBy?: { name?: string; image?: string } | string;
  createdById?: string;
  updatedById?: string;
  updatedBy?: User;
  updatedAt: string | Date;
};

export type savingGoal = {
  id: string;
  title: string;
  targetAmount: DecimalValue;
  currentAmount: DecimalValue;
  deadline?: string | Date | null;
  notes?: string | null;
  createdBy?: { name: string; image: string };
  updatedById?: string;
  updatedBy?: User;
  updatedAt: string | Date;
};

export type CreateTransactionBody = {
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  accountId: string;
  date?: string;
  notes?: string;
};
