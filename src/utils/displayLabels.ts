import type { TFunction } from "i18next";
import type {
  AccountRole,
  Category,
  Currency,
  TransactionType,
} from "../types/account.types";
import type { InviteStatus } from "../types/invite.types";

export function getRoleLabel(t: TFunction, role?: AccountRole | null) {
  if (!role) return "";
  return t(`roles.${role}`, { defaultValue: role });
}

export function getInviteStatusLabel(t: TFunction, status?: InviteStatus | null) {
  if (!status) return "";
  return t(`invites.status.${status}`, { defaultValue: status });
}

export function getCurrencyLabel(t: TFunction, currency?: Currency | null) {
  if (!currency) return "";
  return t(`currencies.${currency}`, { defaultValue: currency });
}

export function getTransactionTypeLabel(
  t: TFunction,
  type?: TransactionType | null,
) {
  if (!type) return "";
  return t(`transactionTypes.${type}`, { defaultValue: type });
}

export function getCategoryLabel(t: TFunction, category?: Category | null) {
  if (!category) return "";
  return t(`categories.${category}`, { defaultValue: category });
}
