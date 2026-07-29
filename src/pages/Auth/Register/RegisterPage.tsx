import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import styles from "./RegisterPage.module.css";
import api from "../../../services/api";
import Message from "../../../components/Message/Message";
import { useAuth } from "../../../hooks/useAuth";
import PasswordField from "../../../components/PasswordField/PasswordField";
import AuthBackNav from "../../../components/AuthBackNav/AuthBackNav";
import AsyncButtonContent from "../../../components/AsyncButtonContent/AsyncButtonContent";

function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<
    "local" | "google" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nav = useNavigate();
  const { authenticateUser } = useAuth();
  const loginWithGoogle = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await api.post("/auth/google", {
          accessToken: tokenResponse.access_token,
        });
        localStorage.setItem("authToken", data.authToken);
        await authenticateUser(data.user);
        nav("/profile", { replace: true });
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(t("auth.register.googleFailed"));
        } else {
          setErrorMessage(t("auth.register.googleFailed"));
        }
      } finally {
        setIsSubmitting(false);
        setSubmissionMethod(null);
      }
    },
    onError: () => {
      setIsSubmitting(false);
      setSubmissionMethod(null);
      setErrorMessage(t("auth.register.googleFailed"));
    },
    onNonOAuthError: () => {
      setIsSubmitting(false);
      setSubmissionMethod(null);
      setErrorMessage(t("auth.register.googleFailed"));
    },
  });

  const handleGoogleLogin = () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmissionMethod("google");
    loginWithGoogle();
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage(t("auth.register.fillAllFields"));
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t("auth.register.passwordTooShort"));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("auth.register.passwordsDoNotMatch"));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmissionMethod("local");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    if (gender) {
      formData.append("gender", gender);
    }

    if (avatar) {
      formData.append("image", avatar);
    }

    try {
      await api.post("/auth/register", formData);

      nav("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(t("auth.register.failed"));
      } else {
        setErrorMessage(t("auth.register.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
      setSubmissionMethod(null);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <AuthBackNav />
      <form
        className={styles.registerForm}
        onSubmit={handleRegister}
        aria-busy={isSubmitting}
      >
        <h2 className={styles.title}>{t("auth.register.title")}</h2>

        <article className={styles.registerField}>
          <label>
            {t("auth.register.fullName")}:
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("auth.register.fullNamePlaceholder")}
            />
          </label>
        </article>

        <section className={styles.registerField}>
          <label htmlFor="register-avatar">
            {t("auth.register.profilePicture")}{" "}
            <small>{t("auth.register.maxSize")}</small>
          </label>
          <input
            id="register-avatar"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setAvatar(file);
              }
            }}
          />
        </section>
        <article className={styles.registerField}>
          <label htmlFor="gender">{t("auth.register.gender")}</label>
          <select
            id="gender"
            name="gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="">{t("genders.select")}</option>
            <option value="MALE">{t("genders.MALE")}</option>
            <option value="FEMALE">{t("genders.FEMALE")}</option>
            <option value="NON_BINARY">{t("genders.NON_BINARY")}</option>
            <option value="TRANS_MAN">{t("genders.TRANS_MAN")}</option>
            <option value="TRANS_WOMAN">{t("genders.TRANS_WOMAN")}</option>
            <option value="AGENDER">{t("genders.AGENDER")}</option>
            <option value="GENDERFLUID">{t("genders.GENDERFLUID")}</option>
            <option value="PREFER_NOT_TO_SAY">{t("genders.PREFER_NOT_TO_SAY")}</option>
            <option value="OTHER">{t("genders.OTHER")}</option>
          </select>
        </article>

        <article className={styles.registerField}>
          <label>
            {t("auth.register.email")}:
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.register.emailPlaceholder")}
            />
          </label>
        </article>

        <article className={styles.registerField}>
          <label>
            {t("auth.register.password")}:
            <PasswordField
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.register.passwordPlaceholder")}
            />
          </label>
        </article>

        <article className={styles.registerField}>
          <label>
            {t("auth.register.confirmPassword")}:
            <PasswordField
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
            />
          </label>
          {confirmPassword && password !== confirmPassword ? (
            <small className={styles.PasswordFormHint}>
              {t("auth.register.passwordsDoNotMatch")}
            </small>
          ) : null}
        </article>
        <article className={styles.registerButton}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isSubmitting}
            aria-busy={submissionMethod === "local"}
          >
            <AsyncButtonContent
              isLoading={submissionMethod === "local"}
              idleLabel={t("auth.register.submit")}
              loadingLabel={t("auth.register.submitting")}
            />
          </button>
        </article>
        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={4000}
        />
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
              loadingLabel={t("auth.register.submitting")}
            />
          </button>
        </article>
        <p className={styles.registerFooter}>
          {t("auth.register.alreadyMember")}{" "}
          <Link to="/login">{t("auth.register.login")}</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
