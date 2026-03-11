import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Hero() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const userName = currentUser?.name?.trim() || t("nav.profile");

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>{t("hero.greeting", { name: userName })}</h3>
        <ThemeToggle className={styles.mobileToggle} />
      </div>
    </div>
  );
}

export default Hero;
