import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TbReport } from "react-icons/tb";
import styles from "./ActionButtons.module.css";
import { FaChartSimple } from "react-icons/fa6";
import { GiExpense, GiReceiveMoney } from "react-icons/gi";

export type ActionButtonsProps = {
  accountId?: string;
};

function ActionButtons({ accountId = "" }: ActionButtonsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasAccount = Boolean(accountId);
  const incomePath = hasAccount
    ? `/accounts/${accountId}/transactions?type=INCOME`
    : "";
  const expensePath = hasAccount
    ? `/accounts/${accountId}/transactions?type=EXPENSE`
    : "";
  const disabledTitle = t("actions.selectAccountFirst");

  return (
    <div className={styles.actionButtonsContainer}>
      {hasAccount ? (
        <Link
          to={incomePath}
          className={styles.actionButton}
          title={t("actions.newIncome")}
        >
          <GiReceiveMoney />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <GiReceiveMoney />
        </button>
      )}

      {hasAccount ? (
        <Link
          to={expensePath}
          className={styles.actionButton}
          title={t("actions.newExpense")}
        >
          <GiExpense />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <GiExpense />
        </button>
      )}

      {hasAccount ? (
        <button
          className={styles.actionButton}
          type="button"
          title={t("actions.transactions")}
          onClick={() => navigate(`/accounts/${accountId}/transactions`)}
        >
          <TbReport />
        </button>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <TbReport />
        </button>
      )}

      {hasAccount ? (
        <button
          className={styles.actionButton}
          type="button"
          title={t("actions.reports")}
          onClick={() => navigate("/reports")}
        >
          <FaChartSimple />
        </button>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <FaChartSimple />
        </button>
      )}
    </div>
  );
}

export default ActionButtons;
