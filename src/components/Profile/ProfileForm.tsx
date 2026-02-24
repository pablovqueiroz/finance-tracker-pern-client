import styles from "../../pages/ProfilePage/ProfilePage.module.css";

type ProfileFormProps = {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  isLoading?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
};

function ProfileForm({ children, onSubmit, submitLabel }: ProfileFormProps) {
  return (
    <form className={styles.profileForm} onSubmit={onSubmit}>
      {children}

      <section className={styles.saveButton}>
        <button type="submit">{submitLabel || "Save Changes"}</button>
      </section>
    </form>
  );
}

export default ProfileForm;
