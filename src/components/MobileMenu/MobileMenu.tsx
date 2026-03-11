import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();

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
    <nav className={styles.mobileMenu}>
      <div className={styles.mobileMenuContent}>
        <NavLink to="/dashboard">
          {({ isActive }) => (isActive ? <IoHomeSharp /> : <IoHomeOutline />)}
        </NavLink>

        <NavLink to="/accounts">
          {({ isActive }) => (isActive ? <HiWallet /> : <HiOutlineWallet />)}
        </NavLink>

        <NavLink to="/create-account">
          <FaCirclePlus className={styles.createNew} />
        </NavLink>

        <NavLink to="/savings">
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
              <NavLink className={styles.profileMenuItem} to="/profile">
                {t("nav.profileDetails")}
              </NavLink>
              <NavLink className={styles.profileMenuItem} to="/invites">
                {t("nav.invites")}
              </NavLink>
              <div className={styles.profileMenuLanguage}>
                <LanguageSwitcher />
              </div>
              <NavLink className={styles.profileMenuItem} to="/contact#contact">
                <FiMessageSquare className={styles.menuIcon} />
                <span>{t("nav.sendFeedback")}</span>
              </NavLink>
              <button
                className={styles.profileMenuBtn}
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
