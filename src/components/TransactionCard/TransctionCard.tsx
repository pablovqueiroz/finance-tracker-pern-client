import styles from "./TransctionCard.module.css"


function TransctionCard() {
  return (
    <div className={styles.transactionCardContainer}>
      <h2>Icon</h2>
      <p>descrition</p>
      <p>category</p>
      <p> (-) or (+)value</p>
    </div>
  )
}
export default TransctionCard