import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import ContactForm from "../components/ContactForm/ContactForm";
import styles from "./ContactPage.module.css";

function ContactPage() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#contact") return;

    const element = document.getElementById("contact");
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [location.hash]);

  return (
    <div className={styles.pageContainer}>
      <section className={`${styles.header} ui-card`}>
        <h2 className={styles.title}>{t("contact.title")}</h2>
        <p className={styles.subtitle}>{t("contact.subtitle")}</p>
      </section>

      <section className={`${styles.section} ui-card`} id="contact">
        <h3 className={styles.sectionTitle}>{t("contact.sectionTitle")}</h3>
        <p className={styles.sectionCopy}>{t("contact.sectionCopy")}</p>
        <ContactForm />
      </section>
    </div>
  );
}

export default ContactPage;
