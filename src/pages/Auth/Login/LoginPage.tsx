import styles from "./LoginPage.module.css";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { API_URL } from "../../../config/config";
import { useAuth } from "../../../hooks/useAuth";
import Message from "../../../components/Message/Message";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authenticateUser } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/auth/login`,
        { email, password }
      );

      localStorage.setItem("authToken", data.authToken);
      await authenticateUser();
      nav("/profile");

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Login failed"
        );
      } else {
        setErrorMessage("Unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleLogin}>
        <h2 className={styles.title}>Welcome Back!</h2>

        <article className={styles.loginField}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email..."
          />
        </article>

        <article className={styles.loginField}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password..."
          />
        </article>

        <article className={styles.loginButton}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </article>

        <Message
          type="error"
          text={errorMessage}
          clearMessage={setErrorMessage}
          duration={4000}
        />

        <p className={styles.loginFooter}>
          New here? <Link to="/register">Sign up</Link> <br />or
        </p>

        <article className={styles.googleLogin}>
          <button
            type="button"
            className={styles.oauthButton}
          >
            <FcGoogle className={styles.oauthGoogleIcon} />
            Continue with Google
          </button>
        </article>
      </form>
    </div>
  );
}

export default LoginPage;
