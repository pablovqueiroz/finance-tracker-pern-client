import { useTranslation } from "react-i18next";
import AsyncButtonContent from "../AsyncButtonContent/AsyncButtonContent";
import styles from "./LoadErrorState.module.css";

type LoadErrorStateProps = {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
};

function LoadErrorState({
  message,
  onRetry,
  isRetrying = false,
  className = "",
}: LoadErrorStateProps) {
  const { t } = useTranslation();

  return (
    <section
      className={`${styles.errorState} ui-card ${className}`.trim()}
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          className="ui-btn"
          type="button"
          disabled={isRetrying}
          aria-busy={isRetrying}
          onClick={onRetry}
        >
          <AsyncButtonContent
            isLoading={isRetrying}
            idleLabel={t("common.tryAgain")}
            loadingLabel={t("common.retrying")}
          />
        </button>
      ) : null}
    </section>
  );
}

export default LoadErrorState;
