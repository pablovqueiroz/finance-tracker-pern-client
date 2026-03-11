import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { useTranslation } from "react-i18next";
import styles from "./CreateAccountPage.module.css";
import api from "../../../services/api";
import Message from "../../../components/Message/Message";
import type { Account, Currency } from "../../../types/account.types";

function CreateAccountPage() {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const CURRENCIES: Currency[] = ["EUR", "USD", "BRL", "GBP", "JPY"];
  const nav = useNavigate();

  const [account, setAccount] = useState<Account>({
    name: "",
    description: "",
    currency: "EUR",
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      ...account,
      name: account.name.trim(),
      description: account.description.trim(),
    };

    if (!payload.name) {
      setErrorMessage(t("accounts.create.nameRequired"));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await api.post("/accounts", payload);

      setSuccessMessage(t("accounts.create.success"));
      setAccount({
        name: "",
        description: "",
        currency: "EUR",
      });
      nav("/accounts");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("accounts.create.failed"),
        );
      } else {
        setErrorMessage(t("accounts.create.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.accountPageContainer}>
      <div className={`${styles.formContainer} ui-card`}>
        <h2 className={styles.title}>{t("accounts.create.title")}</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">
            {t("accounts.create.titleLabel")}:
            <input
              className="ui-control"
              type="text"
              name="name"
              id="name"
              maxLength={20}
              value={account.name}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="description">
            {t("accounts.create.descriptionLabel")}:
            <textarea
              className="ui-control"
              name="description"
              id="description"
              maxLength={60}
              value={account.description}
              onChange={handleChange}
            />
          </label>

          <select
            className="ui-control"
            name="currency"
            id="currency"
            value={account.currency}
            onChange={handleChange}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>

          <article className={styles.registerButton}>
            <button type="submit" className="ui-btn" disabled={isSubmitting}>
              {isSubmitting
                ? t("accounts.create.submitting")
                : t("accounts.create.submit")}
            </button>
          </article>

          <Message
            type="error"
            text={errorMessage}
            clearMessage={setErrorMessage}
            duration={4000}
          />

          <Message
            type="success"
            text={successMessage}
            clearMessage={setSuccessMessage}
            duration={4000}
          />
        </form>
      </div>
    </div>
  );
}

export default CreateAccountPage;
