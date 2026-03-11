import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import SkeletonText from "../Skeleton/SkeletonText";
import Message from "../Message/Message";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../pages/ProfilePage/ProfilePage.module.css";

type AvatarUploaderProps = {
  imageUrl: string;
  onImageUpdated: (imageUrl: string) => void;
};

function AvatarUploader({
  imageUrl,
  onImageUpdated,
}: AvatarUploaderProps) {
  const { t } = useTranslation();
  const { authenticateUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const { data } = await api.put("/users/me", formData);
      onImageUpdated(data.image);
      await authenticateUser();
      setSelectedFile(null);
      setSuccessMessage(t("profile.uploadSuccess"));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message ?? t("profile.uploadFailed"));
      } else {
        setErrorMessage(t("profile.unexpected"));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.avatarUploader}>
      <img
        src={imageUrl}
        alt={t("profile.avatarAlt")}
        className={styles.avatarImage}
      />

      <label className={styles.changeButton}>
        {t("profile.changePhoto")}
        <input type="file" accept="image/*" hidden onChange={handleFileSelect} />
      </label>

      {selectedFile ? (
        <p className={styles.fileInfo}>
          {t("profile.selectedFile", { name: selectedFile.name })}
        </p>
      ) : null}

      <div className={styles.uploadActions}>
        <button
          className={styles.uploadButton}
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {t("profile.uploadImage")}
        </button>

        {isUploading ? (
          <SkeletonText lines={1} widths={["112px"]} lineHeight={16} />
        ) : null}
      </div>

      <Message
        type="success"
        text={successMessage}
        clearMessage={setSuccessMessage}
      />

      <Message
        type="error"
        text={errorMessage}
        clearMessage={setErrorMessage}
        duration={4000}
      />
    </div>
  );
}

export default AvatarUploader;
