import { useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import styles from "./CreateAccountPage.module.css";
import api from "../../services/api";
import Message from "../../components/Message/Message";

type Currency = "EUR" | "USD" | "BRL" | "GBP" | "JPY";

type Account = {
  name: string;
  description: string;
  currency: Currency;
};

function CreateAccountPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [account, setAccount] = useState<Account>({
    name: "",
    description: "",
    currency: "EUR",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      ...account,
      name: account.name.trim(),
      description: account.description.trim(),
    };

    if (!payload.name) {
      setErrorMessage("Account name is required.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await api.post("/accounts", payload);

      setSuccessMessage("Account created successfully!");
      setAccount({
        name: "",
        description: "",
        currency: "EUR",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Create account failed",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.accountPageContainer}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Create an Account</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">
            Title:
            <input
              type="text"
              name="name"
              id="name"
              value={account.name}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="description">
            Description:
            <textarea
              name="description"
              id="description"
              value={account.description}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="currency">
            Currency:
            <select
              name="currency"
              id="currency"
              value={account.currency}
              onChange={handleChange}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="BRL">BRL</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </label>

          <article className={styles.registerButton}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
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
