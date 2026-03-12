import React, { useEffect, useState } from "react";
import axios from "axios";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ProfilePage.module.css";
import api from "../../services/api";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import AvatarUploader from "../../components/Profile/AvatarUploader";
import ProfileForm from "../../components/Profile/ProfileForm";
import SkeletonText from "../../components/Skeleton/SkeletonText";
import Message from "../../components/Message/Message";
import DangerZone from "../../components/Profile/DangerZone";

type UserProfile = {
  name: string;
  email: string;
  gender: string;
  image: string;
  provider?: "LOCAL" | "GOOGLE";
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const defaultImg =
  "https://res.cloudinary.com/dacvtyyst/image/upload/v1769168326/bwcwiefeph34flwiwohy.jpg";

function ProfilePage() {
  const { authenticateUser, handleLogout } = useAuth();
  const { t } = useTranslation();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showGoogleDeleteReauth, setShowGoogleDeleteReauth] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    gender: "",
    image: "",
    provider: "LOCAL",
  });

  const { name, gender, image } = profile;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get<UserProfile>(`/users/me`);

        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
          gender: data.gender ?? "",
          image: data.image ?? "",
          provider: data.provider ?? "LOCAL",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!showGoogleDeleteReauth) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeletingAccount) {
        setShowGoogleDeleteReauth(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showGoogleDeleteReauth, isDeletingAccount]);

  const handleUpdateProfile: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (isUpdatingProfile) return;

    setIsUpdatingProfile(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.put("/users/me", { name: name.trim(), gender });

      await authenticateUser();
      setSuccessMessage(t("profile.updatedSuccessfully"));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("profile.updateFailed"),
        );
      } else {
        setErrorMessage(t("profile.unexpected"));
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleImageUpdated = (newImageUrl: string) => {
    setProfile((prev) => ({
      ...prev,
      image: newImageUrl,
    }));
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t("profile.deleteConfirm"));
    if (!confirmed) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    if (profile.provider === "GOOGLE") {
      setShowGoogleDeleteReauth(true);
      return;
    }

    const password = window.prompt(t("profile.deletePrompt"));
    if (!password) return;

    setIsDeletingAccount(true);

    try {
      await api.delete("/users/me", {
        data: { password },
      });

      handleLogout();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          error.response?.data?.errorMessage ??
          error.response?.data?.message ??
          "";

        if (
          apiMessage ===
          "Google reauthentication is required to delete account."
        ) {
          setShowGoogleDeleteReauth(true);
          setErrorMessage(t("profile.googleReauthRequired"));
          return;
        }

        setErrorMessage(apiMessage || t("profile.deleteFailed"));
      } else {
        setErrorMessage(t("profile.unexpected"));
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleGoogleDeleteReauth = async (
    credentialResponse: CredentialResponse,
  ) => {
    const googleIdToken = credentialResponse.credential;

    if (!googleIdToken) {
      setErrorMessage(t("profile.googleInvalidToken"));
      return;
    }

    setIsDeletingAccount(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.delete("/users/me", {
        data: { googleIdToken },
      });
      handleLogout();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("profile.deleteFailed"),
        );
      } else {
        setErrorMessage(t("profile.unexpected"));
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isPasswordFormValid = (): boolean => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmNewPassword) return false;
    if (newPassword !== confirmNewPassword) return false;
    if (newPassword.length < 6) return false;
    return true;
  };

  const handleChangePassword: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (!isPasswordFormValid()) {
      setErrorMessage(t("profile.fillPasswordFields"));
      return;
    }

    setIsChangingPassword(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.put("/users/me", passwordForm);

      setSuccessMessage(t("profile.passwordUpdated"));

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            t("profile.passwordUpdateFailed"),
        );
      } else {
        setErrorMessage(t("profile.unexpected"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={styles.profilePageContainer}>
      <section className={styles.profileCard}>
        <ProfileHeader />

        <div className={styles.profileForm}>
          <article className={styles.firstBlock}>
            <AvatarUploader
              imageUrl={image || defaultImg}
              onImageUpdated={handleImageUpdated}
            />

            <ProfileForm
              onSubmit={handleUpdateProfile}
              submitLabel={t("profile.saveProfile")}
              isLoading={isUpdatingProfile}
            >
              <label>
                {t("profile.name")}
                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                />
              </label>

              <label>
                {t("profile.gender")}
                <select
                  value={gender}
                  onChange={(event) =>
                    setProfile({ ...profile, gender: event.target.value })
                  }
                >
                  <option value="">{t("genders.select")}</option>
                  <option value="MALE">{t("genders.MALE")}</option>
                  <option value="FEMALE">{t("genders.FEMALE")}</option>
                  <option value="NON_BINARY">{t("genders.NON_BINARY")}</option>
                  <option value="TRANS_MAN">{t("genders.TRANS_MAN")}</option>
                  <option value="TRANS_WOMAN">
                    {t("genders.TRANS_WOMAN")}
                  </option>
                  <option value="AGENDER">{t("genders.AGENDER")}</option>
                  <option value="GENDERFLUID">
                    {t("genders.GENDERFLUID")}
                  </option>
                  <option value="PREFER_NOT_TO_SAY">
                    {t("genders.PREFER_NOT_TO_SAY")}
                  </option>
                  <option value="OTHER">{t("genders.OTHER")}</option>
                </select>
              </label>
            </ProfileForm>
          </article>
        </div>
      </section>

      <section className={styles.securitySection}>
        <h2>{t("profile.security")}</h2>

        <form
          className={styles.profileSecurityForm}
          onSubmit={handleChangePassword}
        >
          <label>
            {t("profile.currentPassword")}
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: event.target.value,
                })
              }
            />
          </label>

          <label>
            {t("profile.newPassword")}
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: event.target.value,
                })
              }
            />
          </label>

          <label>
            {t("profile.confirmNewPassword")}
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmNewPassword: event.target.value,
                })
              }
            />
          </label>

          {isChangingPassword ? (
            <SkeletonText lines={1} widths={["108px"]} lineHeight={16} />
          ) : null}

          <button type="submit" disabled={!isPasswordFormValid()}>
            {t("profile.changePassword")}
          </button>
        </form>

        <DangerZone
          label={t("profile.deleteMyAccount")}
          onDelete={handleDeleteAccount}
        />
      </section>

      {showGoogleDeleteReauth ? (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!isDeletingAccount) setShowGoogleDeleteReauth(false);
          }}
          role="presentation"
        >
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("profile.googleDialogTitle")}
          >
            <h3>{t("profile.googleDialogTitle")}</h3>
            <p>{t("profile.googleDialogCopy")}</p>
            <GoogleLogin
              text="continue_with"
              onSuccess={handleGoogleDeleteReauth}
              onError={() => setErrorMessage(t("profile.googleReauthFailed"))}
            />
            {isDeletingAccount ? (
              <SkeletonText lines={1} widths={["132px"]} lineHeight={16} />
            ) : null}
            <button
              type="button"
              className={styles.logoutButton}
              disabled={isDeletingAccount}
              onClick={() => setShowGoogleDeleteReauth(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      <Message
        type="success"
        text={successMessage}
        clearMessage={setSuccessMessage}
      />
      <Message
        type="error"
        text={errorMessage}
        clearMessage={setErrorMessage}
      />
    </div>
  );
}

export default ProfilePage;
