import { useEffect, useMemo, useRef, useState } from "react";
import { HiLanguage } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import styles from "./LanguageSwitcher.module.css";

type LanguageSwitcherProps = {
  className?: string;
  showLabel?: boolean;
};

const LANGUAGE_OPTIONS = [
  { code: "en", labelKey: "language.english", shortKey: "language.englishShort" },
  {
    code: "pt",
    labelKey: "language.portuguese",
    shortKey: "language.portugueseShort",
  },
  { code: "es", labelKey: "language.spanish", shortKey: "language.spanishShort" },
] as const;

function LanguageSwitcher({
  className = "",
  showLabel = false,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? "en").slice(0, 2);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const currentOption =
    LANGUAGE_OPTIONS.find((option) => option.code === currentLanguage) ??
    LANGUAGE_OPTIONS[0];
  const orderedOptions = useMemo(
    () => [
      currentOption,
      ...LANGUAGE_OPTIONS.filter((option) => option.code !== currentOption.code),
    ],
    [currentOption],
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} language-switcher ${className}`.trim()}
    >
      {showLabel ? <span className={styles.label}>{t("language.label")}</span> : null}

      <button
        className={`${styles.trigger} language-switcher__control`}
        type="button"
        aria-label={`${t("language.label")}: ${t(currentOption.labelKey)}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.triggerContent}>
          <HiLanguage className={styles.icon} aria-hidden="true" />
          <span className={styles.currentLabel}>{t(currentOption.shortKey)}</span>
        </span>
        <span className={styles.currentName}>{t(currentOption.labelKey)}</span>
      </button>

      {isOpen ? (
        <div className={`${styles.menu} language-switcher__menu`} role="menu">
          {orderedOptions.map((option) => {
            const isActive = currentLanguage === option.code;

            return (
              <button
                key={option.code}
                className={`${styles.option} ${isActive ? styles.active : ""} language-switcher__option`.trim()}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setIsOpen(false);
                  void i18n.changeLanguage(option.code);
                }}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionLabel}>{t(option.labelKey)}</span>
                  <span className={styles.optionHint}>{t(option.shortKey)}</span>
                </span>
                {isActive ? (
                  <span className={styles.optionState} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default LanguageSwitcher;
