import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { Currency } from "../../types/account.types";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
} from "./chartFormatters";
import "./chartSetup";

type BalanceHistoryItem = {
  date: string;
  balance: number;
};

type BalanceHistoryChartProps = {
  items: BalanceHistoryItem[];
  currency?: Currency;
};

function BalanceHistoryChart({
  items,
  currency = "EUR",
}: BalanceHistoryChartProps) {
  const { i18n, t } = useTranslation();
  const formatAmount = (value: number) =>
    formatCurrencyValue(value, i18n.resolvedLanguage, currency);
  const data = {
    labels: items.map((item) => item.date),
    datasets: [
      {
        label: t("charts.balance"),
        data: items.map((item) => item.balance),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.16)",
        fill: true,
        tension: 0.25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: { raw?: unknown }) =>
            formatAmount(Number(context.raw ?? 0) || 0),
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

  return <Line data={data} options={options} />;
}

export default BalanceHistoryChart;
