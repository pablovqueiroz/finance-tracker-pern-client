import { useTranslation } from "react-i18next";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";
import AsyncButtonContent from "../AsyncButtonContent/AsyncButtonContent";

type DangerZoneProps = {
  label: string;
  onDelete: () => void;
  isDeleting?: boolean;
};

function DangerZone({
  onDelete,
  label,
  isDeleting = false,
}: DangerZoneProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.dangerContainer}>
      <section className={styles.dangerZone}>
        <h2>{t("profile.dangerTitle")}</h2>
        <p>{t("profile.dangerCopy")}</p>

        <section className={styles.deleteAccountButton}>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onDelete}
            disabled={isDeleting}
            aria-busy={isDeleting}
          >
            <AsyncButtonContent
              isLoading={isDeleting}
              idleLabel={label}
              loadingLabel={t("profile.deleting")}
            />
          </button>
        </section>
      </section>
    </div>
  );
}

export default DangerZone;
