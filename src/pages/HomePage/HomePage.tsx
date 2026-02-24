import { Link } from "react-router";
import styles from "./HomePage.module.css"

function HomePage() {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <h1>Take Control of Your Finances</h1>
                <p>
                    Track your income and expenses, visualize spending by category,
                    and achieve your savings goals — all in one place.
                </p>

                <div className={styles.actions}>
                    <Link to="/register" className={styles.primaryBtn}>
                        Create Account
                    </Link>
                    <Link to="/login" className={styles.secondaryBtn}>
                        Login
                    </Link>
                </div>
            </section>

            <section className={styles.features}>
                <div className={styles.card}>
                    <h3>💸 Track Transactions</h3>
                    <p>Add income and expenses with categories.</p>
                </div>

                <div className={styles.card}>
                    <h3>📊 Smart Charts</h3>
                    <p>Understand your financial behavior visually.</p>
                </div>

                <div className={styles.card}>
                    <h3>🎯 Savings Goals</h3>
                    <p>Set goals and track your financial progress.</p>
                </div>
            </section>
        </div>
    );
}
export default HomePage