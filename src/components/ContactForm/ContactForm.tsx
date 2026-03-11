import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";
import styles from "./ContactForm.module.css";

const SERVICE_ID = "service_dis8jk9";
const TEMPLATE_ID = "template_n3i4ghi";

type ContactFormProps = {
  publicKey?: string;
  className?: string;
};

function ContactForm({
  publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  className = "",
}: ContactFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formRef.current) {
      setErrorMessage(t("contact.formUnavailable"));
      setSuccessMessage("");
      return;
    }

    if (!publicKey) {
      setErrorMessage(t("contact.publicKeyMissing"));
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, publicKey);

      formRef.current.reset();
      setSuccessMessage(t("contact.success"));
    } catch (error) {
      console.error("Failed to send contact message", error);
      setErrorMessage(t("contact.error"));
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className={`${styles.contactForm} ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <div className={styles.fields}>
        <label className={styles.field} htmlFor="contact-name">
          {t("contact.name")}
          <input
            className="ui-control"
            id="contact-name"
            name="name"
            type="text"
            placeholder={t("contact.namePlaceholder")}
            required
          />
        </label>

        <label className={styles.field} htmlFor="contact-email">
          {t("contact.email")}
          <input
            className="ui-control"
            id="contact-email"
            name="email"
            type="email"
            placeholder={t("contact.emailPlaceholder")}
            required
          />
        </label>

        <label className={styles.field} htmlFor="contact-message">
          {t("contact.message")}
          <textarea
            className={`ui-control ${styles.messageField}`}
            id="contact-message"
            name="message"
            placeholder={t("contact.messagePlaceholder")}
            required
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button className="ui-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("contact.sending") : t("contact.sendMessage")}
        </button>

        {successMessage ? (
          <p className={`${styles.status} ${styles.success}`}>{successMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className={`${styles.status} ${styles.error}`}>{errorMessage}</p>
        ) : null}
      </div>
    </form>
  );
}

export default ContactForm;
