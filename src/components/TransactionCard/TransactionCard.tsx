import type { Currency, Transaction } from "../../types/account.types";
import styles from "./TransactionCard.module.css";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";
import { MdOutlineDeleteSweep } from "react-icons/md";

type TransctionCardProps = {
  transaction?: Transaction;
  currency?: Currency;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

function TransactionCard({
  transaction,
  currency,
  onEdit,
  onDelete,
  isDeleting = false,
}: TransctionCardProps) {
  if (!transaction) return null;

  const { title, amount, type, category, date } = transaction;
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

  const isIncome = type === "INCOME";
  const sign = isIncome ? "+" : "-";

  return (
    <div className={styles.transactionCardContainer}>
      <span className={styles.icon}>
        {isIncome ? <FaAngleDoubleUp /> : <FaAngleDoubleDown />}
      </span>
      <article className={styles.info}>
        <p className={styles.title}>{title}</p>
        <p className={styles.category}>{category}</p>
        <small className={styles.date}>{formattedDate}</small>
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
