import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiMessageSquare } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import styles from "./NavBar.module.css";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

function getInitials(name?: string) {
  if (!name) {
    return "";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function NavBar() {
  const { isLoggedIn, handleLogout, currentUser } = useAuth();
  const { t } = useTranslation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const profileInitials = getInitials(currentUser?.name);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  if (!isLoggedIn) return null;

  return (
    <nav className={styles.navBar}>
      <div className={styles.content}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.dashboard")}
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.accounts")}
        </NavLink>

        <NavLink
          to="/savings"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.savings")}
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.reports")}
        </NavLink>

        <NavLink
          to="/create-account"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.newAccount")}
        </NavLink>
        <NavLink
          to="/invites"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          {t("nav.invites")}
        </NavLink>

        <div className={styles.profileWrap} ref={menuRef}>
          <button
            className={styles.profileTrigger}
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label={t("nav.openProfileMenu")}
            title={currentUser?.name || t("nav.profile")}
          >
            {currentUser?.image ? (
              <img
                className={styles.profileImage}
                src={currentUser.image}
                alt={t("profile.avatarAlt")}
              />
            ) : (
              <span className={styles.profileFallback} aria-hidden="true">
                {profileInitials || "?"}
              </span>
            )}
          </button>
          <ThemeToggle className={styles.toggleTheme} />

          {isProfileMenuOpen ? (
            <div className={styles.profileMenu}>
              <NavLink className={styles.menuItem} to="/profile">
                {t("nav.profileDetails")}
              </NavLink>
              <div className={styles.menuLanguage}>
                <LanguageSwitcher />
              </div>
              <NavLink className={styles.menuItem} to="/contact#contact">
                <FiMessageSquare className={styles.menuIcon} />
                <span>{t("nav.sendFeedback")}</span>
              </NavLink>
              <button
                className={styles.menuItemButton}
                type="button"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
