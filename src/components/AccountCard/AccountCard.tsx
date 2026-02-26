import type { AccountSummary } from "../../types/account.types";
import styles from "./AccountCard.module.css";

type AccountCardProps = {
  account: AccountSummary;
  currentUserId: string;
  onSelect: () => void;
};

function AccountCard({ account, currentUserId, onSelect }: AccountCardProps) {
  const { id, name, description, currency, updatedAt, _count } = account;
  const users = account.users ?? [];

  const currentMember = users.find((user) => user.userId === currentUserId);
  const owner = users.find((user) => user.role === "OWNER");
  const otherMembers = users.filter(
    (users) => users.userId !== currentUserId && users.role !== "OWNER",
  );
  const locale = navigator.language ?? "pt-PT";

  const formattedDate = updatedAt
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(updatedAt))
    : "--";

  return (
    <div className={styles.accountCardContainer} onClick={onSelect}>
      <section className={styles.top}>
        <article className={styles.title}>
          <h3>{name}</h3>
          <small className={styles.accountId}>{id}</small>
          {description && <p>{description}</p>}
        </article>
      </section>

      <section className={styles.accountBalance}>
        <span className={styles.currencyBadge}>{currency}</span>
        {_count && <p>Transactions: {_count.transactions}</p>}
      </section>

      <section className={styles.accountOwner}>
        {currentMember && <p>My role: {currentMember.role}</p>}
        {owner && <p>Owner: {owner.user.name}</p>}
        {otherMembers.length > 0 && (
          <article className={styles.membersAvatar}>
            {otherMembers.map((member) => (
              <img
                key={member.userId}
                src={member.user.image}
                alt={member.user.name}
                title={member.user.name}
                className={styles.avatar}
              />
            ))}
          </article>
        )}
      </section>
      <section className={styles.lastUpdate}>
        <p>Last update: {formattedDate}</p>
      </section>
    </div>
  );
}
export default AccountCard;
