import BounceLoader from "react-spinners/BounceLoader";
import styles from "./Spinner.module.css";

type SpinnerProps = {
  fullscreen?: boolean;
  size?: number;
  text?: string;
};

function Spinner({
  fullscreen = false,
  size = 40,
  text = "Loading...",
}: SpinnerProps) {
  return (
    <div
      className={
        fullscreen ? styles.spinnerOverlay : styles.spinnerContainer
      }
    >
      <div className={styles.spinnerContent}>
        <BounceLoader
          size={size}
          color="var(--text-main)"
          aria-label="Loading Spinner"
        />
        <p className={styles.spinnerText}>{text}</p>
      </div>
    </div>
  );
}

export default Spinner;