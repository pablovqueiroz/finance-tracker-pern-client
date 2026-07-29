import Spinner from "../Spinner/Spinner";
import styles from "./LoadingStatus.module.css";

type LoadingStatusProps = {
  label: string;
  page?: boolean;
};

function LoadingStatus({ label, page = false }: LoadingStatusProps) {
  if (!page) {
    return (
      <span
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className={styles.pageStatus}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Spinner size={22} />
      <span>{label}</span>
    </div>
  );
}

export default LoadingStatus;
