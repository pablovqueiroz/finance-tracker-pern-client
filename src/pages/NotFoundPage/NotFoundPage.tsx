import { Link } from "react-router-dom";
import styles from "./NotFoundPage.module.css"

function NotFoundPage() {

return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you are looking for doesn’t exist or may have been moved.
        </p>

        <Link to="/" className={styles.homeBtn}>
          Go Back Home
        </Link>
      </div>
    </div>
  );
  
}
export default NotFoundPage
