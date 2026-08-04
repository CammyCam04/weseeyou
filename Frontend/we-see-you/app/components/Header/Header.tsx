"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.scss";

function NavLinks() {
  const pathname = usePathname();

  return (
    <div className={styles.navLinks}>
      <Link
        href="/"
        className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}
      >
        National Politicians
      </Link>
      <Link
        href="/committees"
        className={`${styles.navItem} ${(pathname || "").startsWith("/committees") ? styles.active : ""}`}
      >
        Committees & Groups
      </Link>
      <Link
        href="/local"
        className={`${styles.navItem} ${(pathname || "").startsWith("/local") ? styles.active : ""}`}
      >
        Local & District
      </Link>
      <Link
        href="/judiciary"
        className={`${styles.navItem} ${(pathname || "").startsWith("/judiciary") || (pathname || "").startsWith("/judge") ? styles.active : ""}`}
      >
        Judiciary
      </Link>
      <Link
        href="/about"
        className={`${styles.navItem} ${(pathname || "").startsWith("/about") ? styles.active : ""}`}
      >
        About & Methodology
      </Link>
      <Link
        href="/test-json"
        className={`${styles.navItem} ${(pathname || "").startsWith("/test-json") ? styles.active : ""}`}
      >
        Raw Data (API Test)
      </Link>
    </div>
  );
}

export default function Header() {
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
        <Suspense fallback={<div className={styles.navLinks} />}>
          <NavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
