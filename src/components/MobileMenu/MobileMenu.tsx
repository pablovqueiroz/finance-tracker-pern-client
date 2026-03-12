import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IoHomeOutline, IoHomeSharp } from "react-icons/io5";
import { HiOutlineWallet, HiWallet } from "react-icons/hi2";
import { FaCirclePlus } from "react-icons/fa6";
import { FiMessageSquare } from "react-icons/fi";
import {
  MdOutlineSavings,
  MdSavings,
  MdOutlineAccountCircle,
} from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import styles from "./MobileMenu.module.css";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

export default function MobileMenu() {
  const { isLoggedIn, handleLogout } = useAuth();
  const { t } = useTranslation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

        <NavLink to="/create-account" onClick={() => setIsProfileMenuOpen(false)}>
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
                {t("nav.profileDetails")}
              </NavLink>
              <NavLink
                className={styles.profileMenuItem}
                to="/invites"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {t("nav.invites")}
              </NavLink>
              <div className={styles.profileMenuLanguage}>
                <LanguageSwitcher />
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
                {t("nav.logout")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
