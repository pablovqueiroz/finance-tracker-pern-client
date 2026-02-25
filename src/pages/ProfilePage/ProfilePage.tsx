import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ProfilePage.module.css";
import axios from "axios";
import api from "../../services/api";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

import ProfileHeader from "../../components/Profile/ProfileHeader";
import AvatarUploader from "../../components/Profile/AvatarUploader";
import ProfileForm from "../../components/Profile/ProfileForm";
import Message from "../../components/Message/Message";
import DangerZone from "../../components/Profile/DangerZone";
import Spinner from "../../components/Spinner/Spinner";

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
        const { data } = await api.get<UserProfile>("/users/me");

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

  // Update profile
  const handleUpdateProfile: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();

    if (isUpdatingProfile) return;

    setIsUpdatingProfile(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.put("/users/me", { name: name.trim(), gender });

      await authenticateUser();
      setSuccessMessage("Profile updated successfully.");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Failed updating profile.",
        );
      } else {
        setErrorMessage("Unexpected error occurred.");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Update avatar locally
  const handleImageUpdated = (newImageUrl: string) => {
    setProfile((prev) => ({
      ...prev,
      image: newImageUrl,
    }));
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account?",
    );
    if (!confirmed) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    if (profile.provider === "GOOGLE") {
      setShowGoogleDeleteReauth(true);
      return;
    }

    const password = window.prompt(
      "Type your password to confirm account deletion:",
    );
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
          apiMessage === "Google reauthentication is required to delete account."
        ) {
          setShowGoogleDeleteReauth(true);
          setErrorMessage("Confirm deletion with Google to continue.");
          return;
        }

        setErrorMessage(
          apiMessage || "Failed deleting profile.",
        );
      } else {
        setErrorMessage("Unexpected error occurred.");
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
      setErrorMessage("Invalid Google token.");
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
            "Failed deleting profile.",
        );
      } else {
        setErrorMessage("Unexpected error occurred.");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Password validation
  const isPasswordFormValid = (): boolean => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmNewPassword) return false;
    if (newPassword !== confirmNewPassword) return false;
    if (newPassword.length < 6) return false;
    return true;
  };

  // Change password
  const handleChangePassword: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();

    if (!isPasswordFormValid()) {
      setErrorMessage("Please fill all fields correctly.");
      return;
    }

    setIsChangingPassword(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.put("/users/me", passwordForm);

      setSuccessMessage("Password updated successfully.");

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
            "Failed to update password.",
        );
      } else {
        setErrorMessage("Unexpected error occurred.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={styles.profilePageContainer}>
      <section className={styles.profileCard}>
        <ProfileHeader />
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className={styles.profileForm}>
          <article className={styles.firstBlock}>
            <AvatarUploader
              imageUrl={image || defaultImg}
              onImageUpdated={handleImageUpdated}
            />

            <ProfileForm
              onSubmit={handleUpdateProfile}
              submitLabel="Save profile"
              isLoading={isUpdatingProfile}
            >
              <label>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </label>

              <label>
                Gender
                <select
                  value={gender}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                  <option value="TRANS_MAN">Trans man</option>
                  <option value="TRANS_WOMAN">Trans woman</option>
                  <option value="AGENDER">Agender</option>
                  <option value="GENDERFLUID">Genderfluid</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </ProfileForm>
          </article>
        </div>
      </section>

      <section className={styles.securitySection}>
        <h2>Security</h2>

        <form
          className={styles.profileSecurityForm}
          onSubmit={handleChangePassword}
        >
          <label>
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
          </label>

          <label>
            New password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmNewPassword: e.target.value,
                })
              }
            />
          </label>

          {isChangingPassword && <Spinner size={16} text="Changing..." />}

          <button type="submit" disabled={!isPasswordFormValid()}>
            Change password
          </button>
        </form>

        <DangerZone label="Delete my account" onDelete={handleDeleteAccount} />
      </section>

      {showGoogleDeleteReauth && (
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
            aria-label="Google reauthentication required"
          >
            <h3>Confirm with Google</h3>
            <p>
              For security, reauthenticate with Google before deleting your
              account.
            </p>
            <GoogleLogin
              text="continue_with"
              onSuccess={handleGoogleDeleteReauth}
              onError={() => setErrorMessage("Google reauthentication failed.")}
            />
            {isDeletingAccount && (
              <Spinner size={16} text="Deleting account..." />
            )}
            <button
              type="button"
              className={styles.logoutButton}
              disabled={isDeletingAccount}
              onClick={() => setShowGoogleDeleteReauth(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
