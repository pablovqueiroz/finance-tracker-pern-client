import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import styles from "./LoginPage.module.css";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import Message from "../../../components/Message/Message";
import PasswordField from "../../../components/PasswordField/PasswordField";
import AuthBackNav from "../../../components/AuthBackNav/AuthBackNav";
import AsyncButtonContent from "../../../components/AsyncButtonContent/AsyncButtonContent";
import LoadingStatus from "../../../components/LoadingStatus/LoadingStatus";
import type { User } from "../../../types/auth.types";

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<
    "local" | "google" | null
  >(null);
  const submissionLockRef = useRef(false);

  const { authenticateUser, isLoading, isLoggedIn } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => {
    const state = location.state as LoginLocationState | null;
    const pathname = state?.from?.pathname;

    if (!pathname || pathname === "/login" || pathname === "/register") {
      return "/profile";
    }

    return `${pathname}${state?.from?.search ?? ""}${state?.from?.hash ?? ""}`;
  }, [location.state]);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      nav(redirectPath, { replace: true });
    }
  }, [isLoading, isLoggedIn, nav, redirectPath]);

  const finishLogin = async (authToken: string, user: User) => {
    localStorage.setItem("authToken", authToken);
    await authenticateUser(user);
  };

  const loginWithGoogle = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await api.post("/auth/google", {
          accessToken: tokenResponse.access_token,
        });

        await finishLogin(data.authToken, data.user);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(t("auth.login.googleFailed"));
        } else {
          setErrorMessage(t("auth.login.googleFailed"));
        }
      } finally {
        submissionLockRef.current = false;
        setIsSubmitting(false);
        setSubmissionMethod(null);
      }
    },
    onError: () => {
      submissionLockRef.current = false;
      setIsSubmitting(false);
      setSubmissionMethod(null);
      setErrorMessage(t("auth.login.googleFailed"));
    },
    onNonOAuthError: () => {
      submissionLockRef.current = false;
      setIsSubmitting(false);
      setSubmissionMethod(null);
      setErrorMessage(t("auth.login.googleFailed"));
    },
  });

  const handleGoogleLogin = () => {
    if (submissionLockRef.current) {
      return;
    }

    submissionLockRef.current = true;
    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmissionMethod("google");
    loginWithGoogle();
  };

  const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submissionLockRef.current) return;

    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage(t("auth.login.fillAllFields"));
      return;
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);
    setSubmissionMethod("local");

    try {
      const { data } = await api.post("/auth/login", { email, password });

      await finishLogin(data.authToken, data.user);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(t("auth.login.failed"));
      } else {
        setErrorMessage(t("auth.login.unexpected"));
      }
    } finally {
      submissionLockRef.current = false;
      setIsSubmitting(false);
      setSubmissionMethod(null);
    }
  };

  if (isLoading) {
    return <LoadingStatus label={t("common.checkingSession")} page />;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.topNav}>
        <AuthBackNav />
      </div>
      <form onSubmit={handleLogin} aria-busy={isSubmitting}>
        <h2 className={styles.title}>{t("auth.login.title")}</h2>

        <article className={styles.loginField}>
          <label htmlFor="login-email">{t("auth.login.email")}</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.login.emailPlaceholder")}
          />
        </article>

        <article className={styles.loginField}>
          <label htmlFor="login-password">{t("auth.login.password")}</label>
          <PasswordField
            id="login-password"
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
            aria-busy={submissionMethod === "local"}
          >
            <AsyncButtonContent
              isLoading={submissionMethod === "local"}
              idleLabel={t("auth.login.submit")}
              loadingLabel={t("auth.login.submitting")}
            />
          </button>
        </article>

        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={15000}
        />

        <p className={styles.loginFooter}>
          {t("auth.login.newHere")} <Link to="/register">{t("auth.login.signUp")}</Link>
        </p>

        <article className={styles.googleLogin}>
          <button
            type="button"
            className={`${styles.googleTrigger} ${styles.oauthButton}`}
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            aria-busy={submissionMethod === "google"}
          >
            <FcGoogle className={styles.oauthGoogleIcon} aria-hidden="true" />
            <AsyncButtonContent
              isLoading={submissionMethod === "google"}
              idleLabel={t("common.continueWithGoogle")}
              loadingLabel={t("auth.login.submitting")}
            />
          </button>
        </article>
      </form>
    </div>
  );
}

export default LoginPage;
