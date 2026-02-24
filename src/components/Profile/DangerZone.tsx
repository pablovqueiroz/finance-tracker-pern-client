import styles from "../../pages/ProfilePage/ProfilePage.module.css"

type DangerZoneProps = {
    label: string,
    onDelete: () => void;
}

function DangerZone({ onDelete, label }: DangerZoneProps) {
    return (
        <div className={styles.dangerContainer}>

            <section className={styles.dangerZone}>
                <h2>Danger Zone</h2>
                <p>
                    This action is irreversible. Your account and all related data will be
                    permanently deleted.
                </p>

                <section className={styles.deleteAccountButton}>
                    <button type="button" className={styles.dangerButton} onClick={onDelete}>
                        {label}
                    </button>
                </section>
            </section>
        </div>
    );
}
export default DangerZone;
