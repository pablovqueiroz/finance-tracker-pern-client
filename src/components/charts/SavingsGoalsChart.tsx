import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import "./chartSetup";

type SavingsGoalItem = {
  name: string;
  currentAmount: number;
  targetAmount: number;
};

type SavingsGoalsChartProps = {
  items: SavingsGoalItem[];
};

function SavingsGoalsChart({ items }: SavingsGoalsChartProps) {
  const { t } = useTranslation();
  const data = {
    labels: items.map((item) => item.name),
    datasets: [
      {
        label: t("charts.currentSaved"),
        data: items.map((item) => item.currentAmount),
        backgroundColor: "#0f766e",
      },
      {
        label: t("charts.targetAmount"),
        data: items.map((item) => item.targetAmount),
        backgroundColor: "#94a3b8",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return <Bar data={data} options={options} />;
}

export default SavingsGoalsChart;
