import { FcGoogle } from "react-icons/fc"
import styles from "./RegisterPage.module.css"
import { Link, useNavigate } from "react-router"
import { useState } from "react"
import { API_URL } from "../../../config/config"
import axios from "axios";
import Message from "../../../components/Message/Message"


function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [gender, setGender] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nav = useNavigate();

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in name, email and password.");
      setIsSubmitting(false)
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsSubmitting(false)
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    if (gender) {
      formData.append("gender", gender);
    }

    if (avatar) {
      formData.append("image", avatar);
    }

    try {
      await axios.post(
        `${API_URL}/auth/register`,
        formData
      );

      nav("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.errorMessage ??
            error.response?.data?.message ??
            "Signup failed"
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form className={styles.registerForm} onSubmit={handleRegister}>
        <h2 className={styles.title}>Join us!</h2>

        <article className={styles.registerField}>
          <label>Full Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full Name..." />
          </label>
        </article>

        <section className={styles.registerField}>
          <label>Profile picture <small>(max 2MB)</small></label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAvatar(file);
              }
            }}
          />
        </section>
        <article className={styles.registerField}>
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                  <option value="TRANS_MAN">Trans man</option>
                  <option value="TRANS_WOMAN">Trans woman</option>
                  <option value="AGENDER">Agender</option>
                  <option value="GENDERFLUID">Genderfluid</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  <option value="OTHER">Other</option>
          </select>
        </article>

        <article className={styles.registerField}>
          <label>Email:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email..." />
          </label>
        </article>

        <article className={styles.registerField}>
          <label>Password:
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password..." />
          </label>
        </article>

        <article className={styles.registerField}>
          <label>Confirm password:
            <input type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password..." />
          </label>
          {confirmPassword && password !== confirmPassword && (
            <small className={styles.PasswordFormHint}>
              Passwords do not match
            </small>
          )}
        </article>
        <article className={styles.registerButton}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </article>
          <Message
            type="error"
            text={errorMessage}
            clearMessage={setErrorMessage}
            duration={4000}
          />
        <p className={styles.registerFooter}>
          or
        </p>
        <article className={styles.googleLogin}>
          <button
            type="button"
            className={styles.oauthButton}
          >
            <FcGoogle className={styles.oauthGoogleIcon} aria-hidden="true" />
            Sign up with Google
          </button>
        </article>
        <p className={styles.registerFooter}>
          Already a member? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  )

}
export default RegisterPage
