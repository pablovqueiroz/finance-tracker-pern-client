import { useState } from "react";
import axios from "axios";
import api from "../../services/api";
import Message from "../Message/Message";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../pages/ProfilePage/ProfilePage.module.css"


type AvatarUploaderProps = {
    imageUrl: string;
    onImageUpdated: (imageUrl: string) => void;
};

function AvatarUploader({
    imageUrl,
    onImageUpdated,
}: AvatarUploaderProps) {
    const { authenticateUser } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] ?? null;

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
            setSuccessMessage("Upload successful");
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.message ?? "Failed to upload image."
                );
            } else {
                setErrorMessage("Unexpected error occurred.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (

        <div className={styles.avatarUploader}>
            <img src={imageUrl} alt="Profile avatar" className={styles.avatarImage} />

            <label className={styles.changeButton}>
                Change photo
                <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileSelect}
                />
            </label>

            {selectedFile && (
                <p className={styles.fileInfo}>
                    Selected file: {selectedFile.name}
                </p>
            )}

            <div className={styles.uploadActions}>
                <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                >
                    Upload image
                </button>

                {isUploading && (
                    <Spinner size={16} text="Uploading..." />
                )}
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
