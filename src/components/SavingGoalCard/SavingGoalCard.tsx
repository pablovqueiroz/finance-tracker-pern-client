import type { Currency, savingGoal } from "../../types/account.types";
import styles from "./SavingGoalCard.module.css";

type SavingGoalCardProps = {
  goal: savingGoal;
  currency: Currency;
};

function SavingGoalCard({ goal, currency }: SavingGoalCardProps) {
  const { title, currentAmount, targetAmount, deadline, notes } = goal;
  const locale = navigator.language ?? "pt-PT";
  const progress = Math.min((currentAmount / targetAmount) * 100, 100).toFixed(
    0,
  );

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);

  const formattedDeadline = deadline
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(deadline))
    : null;

  return (
    <div className={styles.savigGoalCardContainer}>
      <article className={styles.info}>
        <p className={styles.title}>{title}</p>
        {notes && <small className={styles.notes}>{notes}</small>}
      </article>

      <article className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <small>{progress}%</small>
      </article>

      <article className={styles.amounts}>
        <span>{formatAmount(currentAmount)}</span>
        <span> / </span>
        <span>{formatAmount(targetAmount)}</span>
      </article>

      {formattedDeadline && (
        <small className={styles.deadline}>Deadline: {formattedDeadline}</small>
      )}
    </div>
  );
}
export default SavingGoalCard;
