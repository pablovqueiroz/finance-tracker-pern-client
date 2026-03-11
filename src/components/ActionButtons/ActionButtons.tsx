import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import { TbReport } from "react-icons/tb";
import styles from "./ActionButtons.module.css";

type ActionButtonsProps = {
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
          <CiCirclePlus />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <CiCirclePlus />
        </button>
      )}

      {hasAccount ? (
        <Link
          to={expensePath}
          className={styles.actionButton}
          title={t("actions.newExpense")}
        >
          <CiCircleMinus />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title={disabledTitle}
        >
          <CiCircleMinus />
        </button>
      )}

      {hasAccount ? (
        <button
          className={styles.actionButton}
          type="button"
          title={t("actions.reports")}
          onClick={() => navigate("/reports")}
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
    </div>
  );
}

export default ActionButtons;
