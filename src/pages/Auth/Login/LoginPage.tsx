import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTranslation } from "react-i18next";
import styles from "./LoginPage.module.css";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import Message from "../../../components/Message/Message";

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authenticateUser } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage(t("auth.login.fillAllFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.setItem("authToken", data.authToken);
      await authenticateUser();
      nav("/profile");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("auth.login.failed"),
        );
      } else {
        setErrorMessage(t("auth.login.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleLogin}>
        <h2 className={styles.title}>{t("auth.login.title")}</h2>

        <article className={styles.loginField}>
          <label>{t("auth.login.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.login.emailPlaceholder")}
          />
        </article>

        <article className={styles.loginField}>
          <label>{t("auth.login.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("auth.login.passwordPlaceholder")}
          />
        </article>

        <article className={styles.loginButton}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
        </article>

        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={4000}
        />

        <p className={styles.loginFooter}>
          {t("auth.login.newHere")} <Link to="/register">{t("auth.login.signUp")}</Link>{" "}
          <br />
          {t("auth.login.or")}
        </p>

        <article className={styles.googleLogin}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const idToken = credentialResponse.credential;

              if (!idToken) {
                setErrorMessage(t("auth.login.invalidGoogleToken"));
                return;
              }

              try {
                const { data } = await api.post("/auth/google", { idToken });

                localStorage.setItem("authToken", data.authToken);

                await authenticateUser();

                nav("/profile");
              } catch {
                setErrorMessage(t("auth.login.googleFailed"));
              }
            }}
            onError={() => setErrorMessage(t("auth.login.googleFailed"))}
          />
        </article>
      </form>
    </div>
  );
}

export default LoginPage;
