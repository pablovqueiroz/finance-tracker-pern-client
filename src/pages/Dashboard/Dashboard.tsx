import ActionButtons from "../../components/ActionButtons/ActionButtons"
import BalanceCard from "../../components/BalanceCard/BalanceCard"
import Hero from "../../components/Hero/Hero"
import Transactions from "../../components/Transactions/Transactions"
import styles from "./Dashboard.module.css"

function Dashboard() {
    return (
        <div className={styles.DashboardContainer}>

            <section className={styles.welcome}>
                <Hero />
            </section>

            <section className={styles.balanceCard}>
                <BalanceCard />
            </section>

            <section className={styles.actions}>
                <ActionButtons />
            </section>

            <section className={styles.transactions}>
                <Transactions />
    
            </section>

        </div>


    )
}
export default Dashboard