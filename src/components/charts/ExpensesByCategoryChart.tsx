import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { Currency } from "../../types/account.types";
import { expenseChartColors } from "./categoryChartColors";
import { formatCurrencyValue } from "./chartFormatters";
import "./chartSetup";

type CategoryTotal = {
  category: string;
  total: number;
};

type ExpensesByCategoryChartProps = {
  items: CategoryTotal[];
  currency?: Currency;
};

function ExpensesByCategoryChart({
  items,
  currency = "EUR",
}: ExpensesByCategoryChartProps) {
  const { i18n, t } = useTranslation();
  const formatAmount = (value: number) =>
    formatCurrencyValue(value, i18n.resolvedLanguage, currency);
  const data = {
    labels: items.map((item) =>
      t(`categories.${item.category}`, { defaultValue: item.category }),
    ),
    datasets: [
      {
        label: t("charts.expenses"),
        data: items.map((item) => item.total),
        backgroundColor: items.map(
          (_, index) =>
            expenseChartColors[index % expenseChartColors.length],
        ),
        borderColor: "#ffffff",
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
          label: (context: { raw?: unknown }) =>
            formatAmount(Number(context.raw ?? 0) || 0),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default ExpensesByCategoryChart;
