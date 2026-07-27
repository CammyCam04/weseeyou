"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.scss";

export default function Header() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.brand}>
        <span>We See You</span>
      </Link>
      <div className={styles.navLinks}>
        <Link
          href="/"
          className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}
        >
          Politicians
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
          href="/about"
          className={`${styles.navItem} ${pathname.startsWith("/about") ? styles.active : ""}`}
        >
          About & Guide
        </Link>
      </div>
    </nav>
  );
}
