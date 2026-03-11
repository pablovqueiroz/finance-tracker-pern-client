import { useTranslation } from "react-i18next";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";

function ProfileHeader() {
  const { t } = useTranslation();

  return (
    <header className={styles.profileHeader}>
      <h1>{t("profile.title")}</h1>
      <p>{t("profile.subtitle")}</p>
    </header>
  );
}

export default ProfileHeader;
