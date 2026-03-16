import { useTranslation } from "react-i18next";
import type { AccountSummary } from "../../types/account.types";
import { getLocale } from "../../i18n/getLocale";
import styles from "./AccountCard.module.css";

type AccountCardProps = {
  account: AccountSummary;
  currentUserId: string;
  onSelect: () => void;
};

function AccountCard({ account, currentUserId, onSelect }: AccountCardProps) {
  const { i18n, t } = useTranslation();
  const { name, description, currency, updatedAt, _count } = account;
  const users = account.users ?? [];

  const currentMember = users.find((user) => user.userId === currentUserId);
  const owner = users.find((user) => user.role === "OWNER");
  const otherMembers = users.filter(
    (user) => user.userId !== currentUserId && user.role !== "OWNER",
  );
  const locale = getLocale(i18n.resolvedLanguage);
  const numericBalance = Number(account.balance ?? 0);
  const formattedBalance = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number.isFinite(numericBalance) ? numericBalance : 0);

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
          {description ? <p>{description}</p> : null}
        </article>
      </section>

      <section className={styles.accountBalance}>
        <span className={styles.currencyBadge}>{currency}</span>
        <p className={styles.balanceValue}>
          {t("accountCard.balance", { amount: formattedBalance })}
        </p>
        {_count ? (
          <p>{t("accountCard.transactions", { count: _count.transactions })}</p>
        ) : null}
      </section>

      <section className={styles.accountOwner}>
        {currentMember ? (
          <p>
            {t("accountCard.myRole", {
              role: t(`roles.${currentMember.role}`, {
                defaultValue: currentMember.role,
              }),
            })}
          </p>
        ) : null}
        {owner ? (
          <p>{t("accountCard.owner", { name: owner.user.name })}</p>
        ) : null}
        {otherMembers.length > 0 ? (
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
        ) : null}
      </section>
      <section className={styles.lastUpdate}>
        <p>{t("accountCard.lastUpdate", { date: formattedDate })}</p>
      </section>
    </div>
  );
}

export default AccountCard;
