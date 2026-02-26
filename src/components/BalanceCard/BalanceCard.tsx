import type { AccountSummary } from "../../types/account.types";
import styles from "./BalanceCard.module.css";

type BalanceCardProps = {
  accounts: AccountSummary[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
};

function BalanceCard({
  accounts,
  activeIndex,
  onPrev,
  onNext,
  onSelect,
}: BalanceCardProps) {
  const activeAccount = accounts[activeIndex] ?? null;
  const locale = navigator.language ?? "pt-PT";

  if (!activeAccount) {
    return (
      <div className={styles.balanceCardContainer}>
        <p className={styles.emptyState}>No accounts yet.</p>
      </div>
    );
  }

  const updatedAt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(activeAccount.updatedAt));

  return (
    <div className={styles.balanceCardContainer}>
      <section className={styles.header}>
        <small className={styles.counter}>
          Account {activeIndex + 1} of {accounts.length}
        </small>
        <div className={styles.controls}>
          <button type="button" onClick={onPrev} className={styles.navBtn}>
            Prev
          </button>
          <button type="button" onClick={onNext} className={styles.navBtn}>
            Next
          </button>
        </div>
      </section>

      <section className={styles.accountData}>
        <h3>{activeAccount.name}</h3>
        <p>{activeAccount.description || "No description"}</p>
      </section>

      <section className={styles.meta}>
        <span>{activeAccount.currency}</span>
        <span>Transactions: {activeAccount._count?.transactions ?? 0}</span>
        <span>Updated: {updatedAt}</span>
      </section>

      {accounts.length > 1 && (
        <section className={styles.dots}>
          {accounts.map((account, index) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
              aria-label={`Select account ${index + 1}`}
            />
          ))}
        </section>
      )}
    </div>
  );
}

export default BalanceCard;
