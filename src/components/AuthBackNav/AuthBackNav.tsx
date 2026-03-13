import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import styles from "./AuthBackNav.module.css";

function AuthBackNav() {
  const { t } = useTranslation();

  return (
    <nav className={styles.nav} aria-label={t("common.backHome")}>
      <Link to="/" className={styles.backLink}>
        <IoIosArrowBack aria-hidden="true" />
        <span>{t("common.backHome")}</span>
      </Link>
    </nav>
  );
}

export default AuthBackNav;
