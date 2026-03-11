import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TransactionCard from "../TransactionCard/TransactionCard";
import styles from "./Transactions.module.css";
import type {
  AccountMember,
  Currency,
  Transaction,
} from "../../types/account.types";

type TransactionsProps = {
  transactions: Transaction[];
  currency: Currency;
  accountId: string;
  members?: AccountMember[];
};

function Transactions({
  transactions,
  currency,
  accountId,
  members = [],
}: TransactionsProps) {
  const { t } = useTranslation();
  const latest = transactions.slice(0, 5);

  const getCreatorName = (transaction: Transaction) => {
    if (typeof transaction.createdBy === "string") return transaction.createdBy;
    if (transaction.createdBy?.name) return transaction.createdBy.name;
    if (!transaction.createdById) return undefined;
    return members.find((member) => member.userId === transaction.createdById)
      ?.user.name;
  };

  const getUpdaterName = (transaction: Transaction) => {
    if (transaction.updatedBy?.name) return transaction.updatedBy.name;
    if (!transaction.updatedById) return undefined;
    return members.find((member) => member.userId === transaction.updatedById)
      ?.user.name;
  };

  return (
    <div className={styles.transactionContainer}>
      <section className={styles.transactionsTitle}>
        <h4>{t("transactionsList.title")}</h4>
      </section>
      <section className={styles.cardsContainer}>
        {latest.map((transaction) => (
          <Link
            key={transaction.id}
            to={`/accounts/${accountId}/transactions?edit=${transaction.id}`}
            className={styles.transactionCard}
          >
            <TransactionCard
              transaction={transaction}
              currency={currency}
              creatorName={getCreatorName(transaction)}
              updaterName={getUpdaterName(transaction)}
            />
          </Link>
        ))}
      </section>
      {transactions.length > 5 ? (
        <Link
          to={`/accounts/${accountId}/transactions`}
          className={styles.viewMore}
        >
          {t("transactionsList.viewMore", { count: transactions.length - 5 })}
        </Link>
      ) : null}
    </div>
  );
}

export default Transactions;
