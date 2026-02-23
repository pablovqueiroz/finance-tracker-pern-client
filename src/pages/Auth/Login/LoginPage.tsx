import { useState } from "react"
import styles from "./LoginPage.module.css"

function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")


    return (
        <div className={styles.loginContainer}>
            <form >
                <article className={styles.loginField}>
                    <label>Email:
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email..." />

                    </label>
                </article>

                <article className={styles.loginField}>
                    <label>Password
                        <input type="passworfd" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password..." />
                    </label>
                </article>

                <article className={styles.loginButton}>
                    <button>
                        Login
                    </button>
                </article>
                 <article className={styles.googleLogin}>
                    <button>
                        GOOGLE LOGIN
                    </button>
                </article>

            </form>
        </div>
    )
}
export default LoginPage