import { Doughnut } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import "./chartSetup";

type CategoryTotal = {
  category: string;
  total: number;
};

type IncomeByCategoryChartProps = {
  items: CategoryTotal[];
};

const colors = [
  "#16a34a",
  "#059669",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#ea580c",
  "#ca8a04",
];

function IncomeByCategoryChart({ items }: IncomeByCategoryChartProps) {
  const { t } = useTranslation();
  const data = {
    labels: items.map((item) =>
      t(`categories.${item.category}`, { defaultValue: item.category }),
    ),
    datasets: [
      {
        label: t("charts.income"),
        data: items.map((item) => item.total),
        backgroundColor: items.map((_, index) => colors[index % colors.length]),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
  };

  return <Doughnut data={data} options={options} />;
}

export default IncomeByCategoryChart;
