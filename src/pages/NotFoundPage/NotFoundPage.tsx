import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>404</h1>
        <h2>{t("notFound.title")}</h2>
        <p>{t("notFound.subtitle")}</p>

        <Link to="/" className={styles.homeBtn}>
          {t("notFound.action")}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
