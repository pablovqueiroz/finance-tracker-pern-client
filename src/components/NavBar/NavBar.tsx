import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./NavBar.module.css";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function NavBar() {
  const { isLoggedIn, handleLogout, currentUser } = useAuth();
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
    <nav className={styles.navBar}>
      <div className={styles.content}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          Accounts
        </NavLink>
        <NavLink
          to="/create-account"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          New account
        </NavLink>
        <NavLink
          to="/savings"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }
        >
          Savings
        </NavLink>

        <div className={styles.profileWrap} ref={menuRef}>
          <button
            className={`ui-btn ${styles.profileTrigger}`}
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          >
            {currentUser?.name || "Profile"}
          </button>
          <ThemeToggle className={styles.toggleTheme} />
          {isProfileMenuOpen && (
            <div className={styles.profileMenu}>
              <NavLink className={styles.menuItem} to="/profile">
                Profile details
              </NavLink>
              <button
                className={styles.menuItemButton}
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
