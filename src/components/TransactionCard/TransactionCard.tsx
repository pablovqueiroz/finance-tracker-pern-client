import { TiMinus, TiPlus } from "react-icons/ti";
import type { Currency, Transaction } from "../../types/account.types";
import styles from "./TransactionCard.module.css";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";

type TransctionCardProps = {
  transaction?: Transaction;
  currency?: Currency;
};

function TransactionCard({ transaction, currency }: TransctionCardProps) {
  if (!transaction) return null;

  const { title, amount, type, category, date } = transaction;
  const locale = navigator.language ?? "pt-PT";

  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency ?? "EUR",
  }).format(amount);

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

  const isIncome = type === "INCOME";

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
      <p
        className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}
      >
        {isIncome ? <TiPlus /> : <TiMinus />} {formattedAmount}
      </p>
    </div>
  );
}
export default TransactionCard;
