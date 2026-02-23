import styles from "./BalanceCard.module.css"

function BalanceCard() {
  return (
    <div className={styles.balanceCardContainer}>
        <h3>account number</h3>
        <h3>account name</h3>
        <h1>BALANCE</h1>
    </div>
  )
}
export default BalanceCard