import { useTranslation } from "react-i18next";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";

type DangerZoneProps = {
  label: string;
  onDelete: () => void;
};

function DangerZone({ onDelete, label }: DangerZoneProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.dangerContainer}>
      <section className={styles.dangerZone}>
        <h2>{t("profile.dangerTitle")}</h2>
        <p>{t("profile.dangerCopy")}</p>

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
