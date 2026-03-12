import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { Currency } from "../../types/account.types";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
} from "./chartFormatters";
import "./chartSetup";

type IncomeExpenseChartProps = {
  income: number;
  expenses: number;
  currency?: Currency;
};

function IncomeExpenseChart({
  income,
  expenses,
  currency = "EUR",
}: IncomeExpenseChartProps) {
  const { i18n, t } = useTranslation();
  const formatAmount = (value: number) =>
    formatCurrencyValue(value, i18n.resolvedLanguage, currency);
  const data = {
    labels: [t("charts.income"), t("charts.expenses")],
    datasets: [
      {
        label: t("charts.amount"),
        data: [income, expenses],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderColor: ["#15803d", "#b91c1c"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { label?: string; raw?: unknown }) =>
            `${context.label ?? ""}: ${formatAmount(Number(context.raw ?? 0) || 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) =>
            formatCompactCurrencyValue(
              Number(value) || 0,
              i18n.resolvedLanguage,
              currency,
            ),
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default IncomeExpenseChart;
