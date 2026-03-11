import { Pie } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import "./chartSetup";

type CategoryTotal = {
  category: string;
  total: number;
};

type ExpensesByCategoryChartProps = {
  items: CategoryTotal[];
};

const colors = [
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
];

function ExpensesByCategoryChart({ items }: ExpensesByCategoryChartProps) {
  const { t } = useTranslation();
  const data = {
    labels: items.map((item) =>
      t(`categories.${item.category}`, { defaultValue: item.category }),
    ),
    datasets: [
      {
        label: t("charts.expenses"),
        data: items.map((item) => item.total),
        backgroundColor: items.map((_, index) => colors[index % colors.length]),
        borderColor: "#ffffff",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return <Pie data={data} options={options} />;
}

export default ExpensesByCategoryChart;
