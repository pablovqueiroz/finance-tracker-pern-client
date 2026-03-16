import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TbReport } from "react-icons/tb";
import styles from "./ActionButtons.module.css";
import { FaChartSimple, FaCirclePlus } from "react-icons/fa6";

export type ActionButtonsProps = {
  accountId?: string;
  canManageTransactions?: boolean;
};

function ActionButtons({
  accountId = "",
  canManageTransactions = false,
}: ActionButtonsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasAccount = Boolean(accountId);
  const transactionPath = hasAccount ? `/accounts/${accountId}/transactions` : "";
  const disabledTitle = t("actions.selectAccountFirst");

  return (
    <div className={styles.actionButtonsContainer}>
      {hasAccount && canManageTransactions ? (
        <Link
          to={transactionPath}
          className={styles.actionButton}
          title={t("actions.newTransaction")}
        >
          <FaCirclePlus />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={hasAccount ? t("transactionsPage.readOnly") : disabledTitle}
        >
          <FaCirclePlus />
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
