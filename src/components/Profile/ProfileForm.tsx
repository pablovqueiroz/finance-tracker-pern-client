import { useTranslation } from "react-i18next";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";
import AsyncButtonContent from "../AsyncButtonContent/AsyncButtonContent";

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
      aria-busy={isLoading}
    >
      {children}

      <section className={styles.saveButton}>
        <button type="submit" disabled={isLoading} aria-busy={isLoading}>
          <AsyncButtonContent
            isLoading={isLoading}
            idleLabel={submitLabel || t("profile.saveProfile")}
            loadingLabel={t("profile.saving")}
          />
        </button>
      </section>
    </form>
  );
}

export default ProfileForm;
