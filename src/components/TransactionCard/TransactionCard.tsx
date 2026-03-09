import type { Currency, Transaction } from "../../types/account.types";
import styles from "./TransactionCard.module.css";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";
import { MdOutlineDeleteSweep } from "react-icons/md";

type TransctionCardProps = {
  transaction?: Transaction;
  currency?: Currency;
  creatorName?: string;
  updaterName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

function TransactionCard({
  transaction,
  currency,
  creatorName,
  updaterName,
  onEdit,
  onDelete,
  isDeleting = false,
}: TransctionCardProps) {
  if (!transaction) return null;

  const {
    title,
    amount,
    type,
    category,
    date,
    createdBy,
    updatedBy,
    updatedById,
    updatedAt,
  } = transaction;
  const locale = navigator.language ?? "pt-PT";
  const normalizedAmount = Number(amount);
  const safeAmount = Number.isFinite(normalizedAmount) ? normalizedAmount : 0;

  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency ?? "EUR",
  }).format(safeAmount);

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
  const createdByFromTransaction =
    typeof createdBy === "string" ? createdBy : createdBy?.name;
  const resolvedCreatorName = creatorName ?? createdByFromTransaction;
  const createdByLabel = resolvedCreatorName
    ? `Created by ${resolvedCreatorName}`
    : "Creator not informed";
  const resolvedUpdaterName = updaterName ?? updatedBy?.name;
  const hasUpdateInfo = Boolean(resolvedUpdaterName || updatedById);
  const editedByLabel = hasUpdateInfo
    ? resolvedUpdaterName
      ? `Edited by ${resolvedUpdaterName}`
      : "Edited by unknown user"
    : null;
  const updatedAtDate = new Date(updatedAt);
  const hasValidUpdatedAt = Number.isFinite(updatedAtDate.getTime());
  const editedAtLabel =
    hasUpdateInfo && hasValidUpdatedAt
      ? `${new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(updatedAtDate)}`
      : null;
  const isIncome = type === "INCOME";
  const sign = isIncome ? "+" : "-";

  return (
    <div className={styles.transactionCardContainer}>
      <span
        className={`${styles.icon} ${isIncome ? styles.iconIncome : styles.iconExpense}`}
      >
        {isIncome ? <FaAngleDoubleUp /> : <FaAngleDoubleDown />}
      </span>
      <article className={styles.info}>
        <p className={styles.title}>{title}</p>
        <p className={styles.category}>{category}</p>
        <small className={styles.date}>{formattedDate}</small>
        {!hasUpdateInfo && (
          <small className={styles.date}>{createdByLabel}</small>
        )}
        {editedByLabel && (
          <small className={styles.date}>{editedByLabel}</small>
        )}
        {editedAtLabel && (
          <small className={styles.date}>{editedAtLabel}</small>
        )}
      </article>
      <div className={styles.rightBlock}>
        <p
          className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}
        >
          {sign} {formattedAmount}
        </p>
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit transaction"
                aria-label="Edit transaction"
              >
                <FaRegEdit />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                title="Delete transaction"
                aria-label="Delete transaction"
              >
                {isDeleting ? "..." : <MdOutlineDeleteSweep />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default TransactionCard;
