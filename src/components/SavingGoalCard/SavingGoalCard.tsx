import { useTranslation } from "react-i18next";
import type { Currency, savingGoal } from "../../types/account.types";
import { getLocale } from "../../i18n/getLocale";
import styles from "./SavingGoalCard.module.css";

type SavingGoalCardProps = {
  goal: savingGoal;
  currency: Currency;
};

function SavingGoalCard({ goal, currency }: SavingGoalCardProps) {
  const { i18n, t } = useTranslation();
  const { title, currentAmount, targetAmount, deadline, notes } = goal;
  const locale = getLocale(i18n.resolvedLanguage);
  const currentAmountValue = Number(currentAmount);
  const targetAmountValue = Number(targetAmount);
  const safeCurrentAmount = Number.isFinite(currentAmountValue)
    ? currentAmountValue
    : 0;
  const safeTargetAmount =
    Number.isFinite(targetAmountValue) && targetAmountValue > 0
      ? targetAmountValue
      : 1;
  const safeTargetAmountDisplay = Number.isFinite(targetAmountValue)
    ? targetAmountValue
    : 0;
  const progress = Math.min((safeCurrentAmount / safeTargetAmount) * 100, 100)
    .toFixed(0);

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
        {notes ? <small className={styles.notes}>{notes}</small> : null}
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
        <span>{formatAmount(safeCurrentAmount)}</span>
        <span> / </span>
        <span>{formatAmount(safeTargetAmountDisplay)}</span>
      </article>

      {formattedDeadline ? (
        <small className={styles.deadline}>
          {t("common.deadline")}: {formattedDeadline}
        </small>
      ) : null}
    </div>
  );
}

export default SavingGoalCard;
