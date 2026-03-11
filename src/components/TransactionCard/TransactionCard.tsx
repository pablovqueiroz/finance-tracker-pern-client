import { useTranslation } from "react-i18next";
import { FaAngleDoubleDown, FaAngleDoubleUp, FaRegEdit } from "react-icons/fa";
import { MdOutlineDeleteSweep } from "react-icons/md";
import type { Currency, Transaction } from "../../types/account.types";
import { getLocale } from "../../i18n/getLocale";
import styles from "./TransactionCard.module.css";

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
  const { i18n, t } = useTranslation();

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
  const locale = getLocale(i18n.resolvedLanguage);
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
    ? t("transactionCard.createdBy", { name: resolvedCreatorName })
    : t("transactionCard.creatorNotInformed");
  const resolvedUpdaterName = updaterName ?? updatedBy?.name;
  const hasUpdateInfo = Boolean(resolvedUpdaterName || updatedById);
  const editedByLabel = hasUpdateInfo
    ? resolvedUpdaterName
      ? t("transactionCard.editedBy", { name: resolvedUpdaterName })
      : t("transactionCard.editedByUnknown")
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
        <p className={styles.category}>
          {t(`categories.${category}`, { defaultValue: category })}
        </p>
        <small className={styles.date}>{formattedDate}</small>
        {!hasUpdateInfo ? <small className={styles.date}>{createdByLabel}</small> : null}
        {editedByLabel ? <small className={styles.date}>{editedByLabel}</small> : null}
        {editedAtLabel ? <small className={styles.date}>{editedAtLabel}</small> : null}
      </article>
      <div className={styles.rightBlock}>
        <p
          className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}
        >
          {sign} {formattedAmount}
        </p>
        {onEdit || onDelete ? (
          <div className={styles.actions}>
            {onEdit ? (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEdit();
                }}
                title={t("transactionCard.edit")}
                aria-label={t("transactionCard.edit")}
              >
                <FaRegEdit />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                title={t("transactionCard.delete")}
                aria-label={t("transactionCard.delete")}
              >
                {isDeleting ? "..." : <MdOutlineDeleteSweep />}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TransactionCard;
