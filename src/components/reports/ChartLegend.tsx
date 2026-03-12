import styles from "./ChartLegend.module.css";

type ChartLegendItem = {
  label: string;
  color: string;
  value?: string;
};

type ChartLegendProps = {
  items: ChartLegendItem[];
};

function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className={styles.legend}>
      {items.map((item) => (
        <div className={styles.item} key={`${item.label}-${item.color}`}>
          <span
            className={styles.swatch}
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className={styles.label}>{item.label}</span>
          {item.value ? <strong className={styles.value}>{item.value}</strong> : null}
        </div>
      ))}
    </div>
  );
}

export default ChartLegend;
