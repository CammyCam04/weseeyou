"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.scss";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.subHeader}>
        <span>U.S. Congressional & Campaign Transparency Portal</span>
        <div className={styles.systemBadge}>
          <span className={styles.dot} /> Live Data Feed: 119th Congress & FEC Records
        </div>
      </div>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <div className={styles.logoMark}>WSY</div>
          <span className={styles.title}>We See You</span>
        </Link>
        <div className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}
          >
            National Politicians
          </Link>
          <Link
            href="/committees"
            className={`${styles.navItem} ${pathname.startsWith("/committees") ? styles.active : ""}`}
          >
            Committees & Groups
          </Link>
          <Link
            href="/local"
            className={`${styles.navItem} ${pathname.startsWith("/local") ? styles.active : ""}`}
          >
            Local & District
          </Link>
          <Link
            href="/judiciary"
            className={`${styles.navItem} ${pathname.startsWith("/judiciary") || pathname.startsWith("/judge") ? styles.active : ""}`}
          >
            Judiciary
          </Link>
          <Link
            href="/about"
            className={`${styles.navItem} ${pathname.startsWith("/about") ? styles.active : ""}`}
          >
            About & Methodology
          </Link>
        </div>
      </nav>
    </header>
  );
}
