import { getLocale } from "../../i18n/getLocale";
import type { Currency } from "../../types/account.types";

export function formatCurrencyValue(
  value: number,
  language?: string,
  currency: Currency = "EUR",
) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency,
  }).format(value);
}

export function formatCompactCurrencyValue(
  value: number,
  language?: string,
  currency: Currency = "EUR",
) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
