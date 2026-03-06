import styles from "./Hero.module.css";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Hero() {
  const { currentUser } = useAuth();
  const userName = currentUser?.name?.trim() || "User";

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Hello {userName},</h3>
        <ThemeToggle className={styles.mobileToggle} />
      </div>
    </div>
  );
}

export default Hero;
