import styles from "./Hero.module.css";
import { useAuth } from "../../hooks/useAuth";

function Hero() {
  const { currentUser } = useAuth();
  const userName = currentUser?.name?.trim() || "User";

  return (
    <div className={styles.welcomeContainer}>
      <h3 className={styles.title}>Hello {userName},</h3>
    </div>
  );
}

export default Hero;
