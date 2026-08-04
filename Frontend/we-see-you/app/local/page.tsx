import Link from "next/link";
import styles from "./local.module.scss";

export default function LocalPage() {
  return (
    <div className={styles.container}>
      <div className={styles.comingSoonCard}>
        <div className={styles.badge}>Under Construction</div>
        <h1 className={styles.title}>Local & District Elections</h1>
        <p className={styles.description}>
          We are currently restructuring our data feeds and API integrations to provide accurate, high-performance local representation details. Check back soon for updates.
        </p>
        <Link href="/" className={styles.backBtn}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
