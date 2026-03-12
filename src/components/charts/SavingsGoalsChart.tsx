import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { Currency } from "../../types/account.types";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
} from "./chartFormatters";
import "./chartSetup";

type SavingsGoalMovement = {
  date: string;
  depositAmount: number;
  withdrawalAmount: number;
};

type SavingsGoalItem = {
  name: string;
  currentAmount: number;
  targetAmount: number;
  depositAmount: number;
  withdrawalAmount: number;
  movements: SavingsGoalMovement[];
} | null;

type SavingsGoalsChartProps = {
  item: SavingsGoalItem;
  currency?: Currency;
};

function SavingsGoalsChart({
  item,
  currency = "EUR",
}: SavingsGoalsChartProps) {
  const { i18n, t } = useTranslation();
  const formatAmount = (value: number) =>
    formatCurrencyValue(value, i18n.resolvedLanguage, currency);

  if (!item) {
    return null;
  }

  const chartMovements =
    item.movements.length > 0
      ? item.movements
      : [
          {
            date: t("charts.currentSaved"),
            depositAmount: 0,
            withdrawalAmount: 0,
            cumulativeAmount: item.currentAmount,
          },
        ];

  const data = {
    labels: chartMovements.map((movement) => movement.date),
    datasets: [
      {
        label: t("charts.deposits"),
        data: chartMovements.map((movement) => movement.depositAmount),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.18)",
        tension: 0.28,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
      {
        label: t("charts.withdrawals"),
        data: chartMovements.map((movement) => movement.withdrawalAmount),
        borderColor: "#e11d48",
        backgroundColor: "rgba(225, 29, 72, 0.18)",
        tension: 0.28,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const rawValue = Number(context.raw ?? 0) || 0;
            const value =
              context.dataset.label === t("charts.withdrawals")
                ? Math.abs(rawValue)
                : rawValue;

            return `${context.dataset.label}: ${formatAmount(value)}`;
          },
          afterBody: () => {
            return [
              `${t("charts.targetAmount")}: ${formatAmount(item.targetAmount)}`,
              `${t("reportsPage.remainingToGoal")}: ${formatAmount(
                Math.max(item.targetAmount - item.currentAmount, 0),
              )}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          callback: (value) =>
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

export default SavingsGoalsChart;
