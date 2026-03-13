import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import styles from "./LoginPage.module.css";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import Message from "../../../components/Message/Message";
import PasswordField from "../../../components/PasswordField/PasswordField";
import Spinner from "../../../components/Spinner/Spinner";
import AuthBackNav from "../../../components/AuthBackNav/AuthBackNav";

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authenticateUser } = useAuth();
  const nav = useNavigate();
  const loginWithGoogle = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await api.post("/auth/google", {
          accessToken: tokenResponse.access_token,
        });

        localStorage.setItem("authToken", data.authToken);
        await authenticateUser();
        nav("/profile");
      } catch {
        setErrorMessage(t("auth.login.googleFailed"));
      }
    },
    onError: () => setErrorMessage(t("auth.login.googleFailed")),
    onNonOAuthError: () => setErrorMessage(t("auth.login.googleFailed")),
  });

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
      <div className={styles.topNav}>
        <AuthBackNav />
      </div>
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
          <PasswordField
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
            {isSubmitting ? (
              <span className={styles.buttonContent}>
                <Spinner loadingLabel={t("auth.login.submitting")} />
                <span>{t("auth.login.submitting")}</span>
              </span>
            ) : (
              t("auth.login.submit")
            )}
          </button>
        </article>

        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={4000}
        />

        <p className={styles.loginFooter}>
          {t("auth.login.newHere")} <Link to="/register">{t("auth.login.signUp")}</Link>
        </p>

        <article className={styles.googleLogin}>
          <button
            type="button"
            className={`${styles.googleTrigger} ${styles.oauthButton}`}
            onClick={() => loginWithGoogle()}
          >
            <FcGoogle className={styles.oauthGoogleIcon} aria-hidden="true" />
            <span>{t("common.continueWithGoogle")}</span>
          </button>
        </article>
      </form>
    </div>
  );
}

export default LoginPage;
