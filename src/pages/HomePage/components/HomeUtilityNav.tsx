import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import LanguageSwitcher from "../../../components/LanguageSwitcher/LanguageSwitcher";
import styles from "./HomeUtilityNav.module.css";

function HomeUtilityNav() {
  const { t } = useTranslation();

  return (
    <nav className={styles.nav} aria-label={t("home.eyebrow")}>
      <div className={styles.actions}>
        <Link to="/register" className={styles.primaryBtn}>
          {t("home.primaryAction")}
        </Link>
        <Link to="/login" className={styles.secondaryBtn}>
          {t("home.secondaryAction")}
        </Link>
      </div>

      <div className={styles.controls}>
        <LanguageSwitcher className={styles.languageSwitcher} />
        <ThemeToggle className={styles.themeToggle} />
      </div>
    </nav>
  );
}

export default HomeUtilityNav;
