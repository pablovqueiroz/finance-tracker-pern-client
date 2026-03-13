import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiMessageSquare } from "react-icons/fi";
import { IoHomeOutline, IoPersonAddOutline } from "react-icons/io5";
import { HiOutlineWallet } from "react-icons/hi2";
import { MdOutlineSavings } from "react-icons/md";
import { FaChartSimple } from "react-icons/fa6";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const profileInitials = getInitials(currentUser?.name);
  const primaryNavItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: IoHomeOutline },
    { to: "/accounts", label: t("nav.accounts"), icon: HiOutlineWallet },
    { to: "/reports", label: t("nav.reports"), icon: FaChartSimple },
    { to: "/savings", label: t("nav.savings"), icon: MdOutlineSavings },
  ];
  const utilityNavItems = [
    { to: "/invites", label: t("nav.invites"), icon: IoPersonAddOutline },
  ];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!isLoggedIn) return null;

  return (
    <nav className={styles.navBar}>
      <div
        className={styles.content}
        key={`${location.pathname}-${currentUser?.image ?? ""}`}
      >
        <div className={styles.navGroup}>
          {primaryNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
            >
              <Icon className={styles.linkIcon} aria-hidden="true" />
              <span className={styles.linkLabel}>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.utilityGroup}>
          {utilityNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.link} ${styles.utilityLink} ${
                  isActive ? styles.active : ""
                }`
              }
            >
              <Icon className={styles.linkIcon} aria-hidden="true" />
              <span className={styles.linkLabel}>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.profileWrap} ref={menuRef}>
          <button
            className={styles.profileTrigger}
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label={t("nav.openProfileMenu")}
            title={currentUser?.name || t("nav.profile")}
          >
            {currentUser?.image && !hasImageError ? (
              <img
                className={styles.profileImage}
                src={currentUser.image}
                alt={t("profile.avatarAlt")}
                onError={() => setHasImageError(true)}
                onLoad={() => setHasImageError(false)}
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
