import { CiCircleMinus, CiCirclePlus } from "react-icons/ci"
import { TbReport } from "react-icons/tb"
import styles from "./ActionButtons.module.css"
import { Link } from "react-router"

function ActionButtons() {
    return (
        <div className={styles.actionButtonsContainer}>
            <Link to="" className={styles.actionButton}>
                <CiCirclePlus />
            </Link>

            <Link to="" className={styles.actionButton}>
                <CiCircleMinus />
            </Link>

            <Link to="" className={styles.actionButton}>
                <TbReport />
            </Link>
        </div>
    )
}
export default ActionButtons