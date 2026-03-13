import type { TFunction } from "i18next";
import type { Category, TransactionType } from "../types/account.types";
import {
  getCategoryLabel,
  getTransactionTypeLabel,
} from "./displayLabels";

export const INCOME_CATEGORIES: Category[] = [
  "SALARY",
  "BONUS",
  "FREELANCE",
  "BUSINESS_REVENUE",
  "RENTAL_INCOME",
  "DIVIDENDS",
  "INTEREST",
  "REFUNDS",
  "GIFTS_RECEIVED",
  "OTHERS",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "HOUSING",
  "ELECTRICITY",
  "WATER",
  "GAS",
  "HOME_INTERNET",
  "MOBILE_PHONE",
  "GROCERIES",
  "RESTAURANTS_DELIVERY",
  "TRANSPORT_FUEL",
  "HEALTH_PHARMACY",
  "LEISURE_HOBBIES",
  "SUBSCRIPTIONS_STREAMING",
  "SHOPPING",
  "EDUCATION",
  "PERSONAL_CARE",
  "INVESTMENTS",
  "DEBT_INSTALLMENTS",
  "OTHERS",
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

const CATEGORY_LABELS: Record<Category, string> = {
  SALARY: "Salary",
  BONUS: "Bonus",
  FREELANCE: "Freelance",
  BUSINESS_REVENUE: "Business Revenue",
  RENTAL_INCOME: "Rental Income",
  DIVIDENDS: "Dividends",
  INTEREST: "Interest",
  REFUNDS: "Refunds",
  GIFTS_RECEIVED: "Gifts Received",
  HOUSING: "Housing",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  GAS: "Gas",
  HOME_INTERNET: "Home Internet",
  MOBILE_PHONE: "Mobile Phone",
  GROCERIES: "Groceries",
  RESTAURANTS_DELIVERY: "Restaurants and Delivery",
  TRANSPORT_FUEL: "Transport and Fuel",
  HEALTH_PHARMACY: "Health and Pharmacy",
  LEISURE_HOBBIES: "Leisure and Hobbies",
  SUBSCRIPTIONS_STREAMING: "Subscriptions and Streaming",
  SHOPPING: "Shopping",
  EDUCATION: "Education",
  PERSONAL_CARE: "Personal Care",
  INVESTMENTS: "Investments",
  DEBT_INSTALLMENTS: "Debt Installments",
  OTHERS: "Others",
};

const TYPE_ALIASES: Record<TransactionType, string[]> = {
  INCOME: ["income", "receita", "ingreso", "entry", "inflow"],
  EXPENSE: ["expense", "despesa", "gasto", "outflow"],
};

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTransactionTypeInput(
  value: string,
  t: TFunction,
): TransactionType | null {
  const normalizedValue = normalizeToken(value);

  for (const type of ["INCOME", "EXPENSE"] as const) {
    const candidates = new Set([
      type,
      type.toLowerCase(),
      getTransactionTypeLabel(t, type),
      ...TYPE_ALIASES[type],
    ]);

    if (
      Array.from(candidates).some(
        (candidate) => normalizeToken(candidate) === normalizedValue,
      )
    ) {
      return type;
    }
  }

  return null;
}

export function normalizeCategoryInput(
  value: string,
  t: TFunction,
): Category | null {
  const normalizedValue = normalizeToken(value);

  for (const category of ALL_CATEGORIES) {
    const candidates = new Set([
      category,
      category.replaceAll("_", " "),
      CATEGORY_LABELS[category],
      getCategoryLabel(t, category),
    ]);

    if (
      Array.from(candidates).some(
        (candidate) => normalizeToken(candidate) === normalizedValue,
      )
    ) {
      return category;
    }
  }

  return null;
}
