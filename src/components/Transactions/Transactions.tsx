import { Link } from "react-router"
import TransctionCard from "../TransactionCard/TransctionCard"
import styles from "./Transactions.module.css"

function Transactions() {
  return (
    <div className={styles.transactionContainer}>
     <section className={styles.transactionsTitle}>
      <h4>Transactions</h4>
     </section>
      <section className={styles.cardsContainer}>

        <Link to="" className={styles.transactionCard}>
          <TransctionCard />
        </Link>

        <Link to="" className={styles.transactionCard}>
          <TransctionCard />
        </Link>

        <Link to="" className={styles.transactionCard}>
          <TransctionCard />
        </Link>

        <Link to="" className={styles.transactionCard}>
          <TransctionCard />
        </Link>

      </section>

    </div>
  )
}
export default Transactions