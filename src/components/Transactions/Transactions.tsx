import { Link } from "react-router-dom";
import TransactionCard from "../TransactionCard/TransactionCard";
import styles from "./Transactions.module.css";
import type { Currency, Transaction } from "../../types/account.types";

type TransactionsProps = {
  transactions: Transaction[];
  currency: Currency;
  accountId: string;
};

function Transactions({
  transactions,
  currency,
  accountId,
}: TransactionsProps) {
  const latest = transactions.slice(0, 5);
  return (
    <div className={styles.transactionContainer}>
      <section className={styles.transactionsTitle}>
        <h4>Transactions</h4>
      </section>
      <section className={styles.cardsContainer}>
        {latest.map((transaction) => (
          <Link
            key={transaction.id}
            to={`/transactions/${transaction.id}`}
            className={styles.transactionCard}
          >
            <TransactionCard transaction={transaction} currency={currency} />
          </Link>
        ))}
      </section>
      {transactions.length > 5 && (
        <Link
          to={`/accounts/${accountId}/transactions`}
          className={styles.viewMore}
        >
          Ver mais ({transactions.length - 5})
        </Link>
      )}
    </div>
  );
}
export default Transactions;
