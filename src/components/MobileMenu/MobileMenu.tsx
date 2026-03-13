import { useEffect, useRef, useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IoHomeOutline, IoHomeSharp } from "react-icons/io5";
import { IoPersonAddOutline } from "react-icons/io5";
import { HiOutlineWallet, HiWallet } from "react-icons/hi2";
import { FaCirclePlus } from "react-icons/fa6";
import { FiMessageSquare } from "react-icons/fi";
import {
  MdOutlineSavings,
  MdSavings,
  MdOutlineAccountCircle,
} from "react-icons/md";
import { TbReport } from "react-icons/tb";
import { useAuth } from "../../hooks/useAuth";
import styles from "./MobileMenu.module.css";
import { RiLogoutBoxLine } from "react-icons/ri";
import { RxAvatar } from "react-icons/rx";

export default function MobileMenu() {
  const { isLoggedIn, handleLogout } = useAuth();
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentLanguage = (i18n.resolvedLanguage ?? "en").slice(0, 2);
  const currentAccountId =
    matchPath("/accounts/:accountId/*", location.pathname)?.params.accountId ??
    matchPath("/accounts/:accountId", location.pathname)?.params.accountId ??
    "";
  const languageOptions = [
    { code: "en", label: t("language.englishShort") },
    { code: "pt", label: t("language.portugueseShort") },
    { code: "es", label: t("language.spanishShort") },
  ] as const;

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
    <nav className={styles.mobileMenu}>
      <div className={styles.mobileMenuContent}>
        <NavLink to="/dashboard" onClick={() => setIsProfileMenuOpen(false)}>
          {({ isActive }) => (isActive ? <IoHomeSharp /> : <IoHomeOutline />)}
        </NavLink>

        <NavLink to="/accounts" onClick={() => setIsProfileMenuOpen(false)}>
          {({ isActive }) => (isActive ? <HiWallet /> : <HiOutlineWallet />)}
        </NavLink>

        <NavLink
          to="/create-account"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <FaCirclePlus className={styles.createNew} />
        </NavLink>

        <NavLink to="/savings" onClick={() => setIsProfileMenuOpen(false)}>
          {({ isActive }) => (isActive ? <MdSavings /> : <MdOutlineSavings />)}
        </NavLink>

        <div className={styles.profileWrap} ref={menuRef}>
          <button
            className={styles.profileBtn}
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label={t("nav.openProfileMenu")}
          >
            <MdOutlineAccountCircle />
          </button>

          {isProfileMenuOpen ? (
            <div className={styles.profileMenu}>
              <NavLink
                className={styles.profileMenuItem}
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <RxAvatar className={styles.menuIcon} />{" "}
                {t("nav.profileDetails")}
              </NavLink>
              <NavLink
                className={styles.profileMenuItem}
                to="/reports"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <TbReport className={styles.menuIcon} />
                <span>{t("nav.reports")}</span>
              </NavLink>
              {currentAccountId ? (
                <NavLink
                  className={styles.profileMenuItem}
                  to={`/accounts/${currentAccountId}/transactions`}
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <TbReport className={styles.menuIcon} />
                  <span>{t("nav.transactions")}</span>
                </NavLink>
              ) : null}
              <NavLink
                className={styles.profileMenuItem}
                to="/invites"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <IoPersonAddOutline className={styles.menuIcon} />
                <span>{t("nav.invites")}</span>
              </NavLink>
              <div className={styles.profileMenuLanguage}>
                <span className={styles.languageLabel}>
                  {t("language.label")}
                </span>
                <div className={styles.languageOptions}>
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      className={`${styles.languageButton} ${
                        currentLanguage === option.code
                          ? styles.languageButtonActive
                          : ""
                      }`.trim()}
                      type="button"
                      onClick={() => {
                        void i18n.changeLanguage(option.code);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <NavLink
                className={styles.profileMenuItem}
                to="/contact#contact"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <FiMessageSquare className={styles.menuIcon} />
                <span>{t("nav.sendFeedback")}</span>
              </NavLink>
              <button
                className={styles.profileMenuBtn}
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
              >
                <RiLogoutBoxLine className={styles.menuIcon} />
                {t("nav.logout")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
