import styles from "./Spinner.module.css";

type SpinnerProps = {
  size?: number;
  color?: string;
  loadingLabel?: string;
};

function Spinner({
  size = 18,
  color = "currentColor",
  loadingLabel,
}: SpinnerProps) {
  return (
    <span
      className={styles.spinner}
      aria-hidden={loadingLabel ? undefined : "true"}
      aria-label={loadingLabel}
      role={loadingLabel ? "img" : undefined}
      style={{
        width: size,
        height: size,
        color,
      }}
    />
  );
}

export default Spinner;
