import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import "./chartSetup";

type IncomeExpenseChartProps = {
  income: number;
  expenses: number;
};

function IncomeExpenseChart({
  income,
  expenses,
}: IncomeExpenseChartProps) {
  const { t } = useTranslation();
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
    },
  };

  return <Bar data={data} options={options} />;
}

export default IncomeExpenseChart;
