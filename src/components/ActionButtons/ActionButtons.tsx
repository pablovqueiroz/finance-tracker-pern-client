import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import { TbReport } from "react-icons/tb";
import styles from "./ActionButtons.module.css";
import { Link } from "react-router-dom";

type ActionButtonsProps = {
  accountId?: string;
};

function ActionButtons({ accountId = "" }: ActionButtonsProps) {
  const hasAccount = Boolean(accountId);
  const incomePath = hasAccount
    ? `/accounts/${accountId}/transactions?type=INCOME`
    : "";
  const expensePath = hasAccount
    ? `/accounts/${accountId}/transactions?type=EXPENSE`
    : "";
  const transactionsPath = hasAccount ? `/accounts/${accountId}/transactions` : "";

  return (
    <div className={styles.actionButtonsContainer}>
      {hasAccount ? (
        <Link to={incomePath} className={styles.actionButton} title="New income">
          <CiCirclePlus />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title="Select an account first"
        >
          <CiCirclePlus />
        </button>
      )}

      {hasAccount ? (
        <Link
          to={expensePath}
          className={styles.actionButton}
          title="New expense"
        >
          <CiCircleMinus />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title="Select an account first"
        >
          <CiCircleMinus />
        </button>
      )}

      {hasAccount ? (
        <Link
          to={transactionsPath}
          className={styles.actionButton}
          title="Transactions list"
        >
          <TbReport />
        </Link>
      ) : (
        <button
          className={`${styles.actionButton} ${styles.disabled}`}
          type="button"
          disabled
          title="Select an account first"
        >
          <TbReport />
        </button>
      )}
    </div>
  );
}

export default ActionButtons;
