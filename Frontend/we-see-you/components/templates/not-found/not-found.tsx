import Link from "next/link";
import styles from "./not-found.module.scss";

export default function NotFoundView() {
  return (
    <div className={styles.container}>
      <h2>404 - Page Not Found</h2>
      <p>The requested page or record could not be found in our civic registry.</p>
      <Link href="/" className={styles.homeBtn}>
        Return to National Congress
      </Link>
    </div>
  );
}
