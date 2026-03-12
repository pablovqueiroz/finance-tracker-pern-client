import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import styles from "./PasswordField.module.css";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

function PasswordField({
  className = "",
  ...inputProps
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.field}>
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        className={`${styles.input} ${className}`.trim()}
      />
      <button
        className={styles.toggle}
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={
          isVisible ? t("common.hidePassword") : t("common.showPassword")
        }
        title={isVisible ? t("common.hidePassword") : t("common.showPassword")}
      >
        {isVisible ? <IoEyeOffOutline /> : <IoEyeOutline />}
      </button>
    </div>
  );
}

export default PasswordField;
