import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTranslation } from "react-i18next";
import styles from "./RegisterPage.module.css";
import api from "../../../services/api";
import Message from "../../../components/Message/Message";
import { useAuth } from "../../../hooks/useAuth";

function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nav = useNavigate();
  const { authenticateUser } = useAuth();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage(t("auth.register.fillAllFields"));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("auth.register.passwordsDoNotMatch"));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

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
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("auth.register.failed"),
        );
      } else {
        setErrorMessage(t("auth.register.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form className={styles.registerForm} onSubmit={handleRegister}>
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
          <label>
            {t("auth.register.profilePicture")}{" "}
            <small>{t("auth.register.maxSize")}</small>
          </label>
          <input
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
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.register.passwordPlaceholder")}
            />
          </label>
        </article>

        <article className={styles.registerField}>
          <label>
            {t("auth.register.confirmPassword")}:
            <input
              type="password"
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
          >
            {isSubmitting
              ? t("auth.register.submitting")
              : t("auth.register.submit")}
          </button>
        </article>
        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={4000}
        />
        <p className={styles.registerFooter}>{t("auth.register.or")}</p>
        <article className={styles.googleLogin}>
          <GoogleLogin
            text="signup_with"
            onSuccess={async (credentialResponse) => {
              const idToken = credentialResponse.credential;

              if (!idToken) {
                setErrorMessage(t("auth.register.invalidGoogleToken"));
                return;
              }

              try {
                const { data } = await api.post("/auth/google", { idToken });
                localStorage.setItem("authToken", data.authToken);
                await authenticateUser();
                nav("/profile");
              } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                  setErrorMessage(
                    error.response?.data?.errorMessage ??
                      error.response?.data?.message ??
                      t("auth.register.googleFailed"),
                  );
                } else {
                  setErrorMessage(t("auth.register.googleFailed"));
                }
              }
            }}
            onError={() => setErrorMessage(t("auth.register.googleFailed"))}
          />
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
