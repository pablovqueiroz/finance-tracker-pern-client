import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import "./chartSetup";

type BalanceHistoryItem = {
  date: string;
  balance: number;
};

type BalanceHistoryChartProps = {
  items: BalanceHistoryItem[];
};

function BalanceHistoryChart({ items }: BalanceHistoryChartProps) {
  const { t } = useTranslation();
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
  };

  return <Line data={data} options={options} />;
}

export default BalanceHistoryChart;
