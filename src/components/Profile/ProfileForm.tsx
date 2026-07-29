import { useTranslation } from "react-i18next";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";

type ProfileFormProps = {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  isLoading?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
};

function ProfileForm({
  children,
  onSubmit,
  submitLabel,
  isLoading = false,
}: ProfileFormProps) {
  const { t } = useTranslation();

  return (
    <form
      className={styles.profileForm}
      onSubmit={onSubmit}
      aria-label={t("profile.title")}
    >
      {children}

      <section className={styles.saveButton}>
        <button type="submit" disabled={isLoading}>
          {submitLabel || t("profile.saveProfile")}
        </button>
      </section>
    </form>
  );
}

export default ProfileForm;
