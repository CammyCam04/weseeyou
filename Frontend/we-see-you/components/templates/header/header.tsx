"use client";

import React from "react";
import Link from "next/link";
import styles from "./header.module.scss";

// Boolean toggle: set to true to display the "Raw Data (API Test)" link in the top navbar.
// Regardless of this setting, the test page remains accessible for developer inspection.
export const SHOW_TEST_API_NAV = false;

export interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Header({ activeTab = "national", onTabChange }: HeaderProps) {
  const handleNavClick = (e: React.MouseEvent, tab: string) => {
    if (onTabChange) {
      e.preventDefault();
      onTabChange(tab);
    }
  };

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.subHeader}>
        <div className={styles.systemBadge}>
          <span className={styles.dot}></span>
          <span>Verified Government Data • U.S. Congress & FEC 2024-2026</span>
        </div>
        <div>Nonpartisan Transparency Platform</div>
      </div>

      <div className={styles.navbar}>
        <div
          className={styles.brand}
          onClick={(e) => handleNavClick(e, "national")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.logoMark}>
            <span>WSY</span>
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.title}>We See You</span>
            <span className={styles.subtitle}>Political Transparency Portal</span>
          </div>
        </div>

        <nav className={styles.navLinks}>
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "national")}
            className={`${styles.navItem} ${activeTab === "national" ? styles.active : ""}`}
          >
            National
          </Link>
          <Link
            href="/state"
            onClick={(e) => handleNavClick(e, "state")}
            className={`${styles.navItem} ${activeTab === "state" ? styles.active : ""}`}
          >
            State
          </Link>
          <Link
            href="/county-municipality"
            onClick={(e) => handleNavClick(e, "county-municipality")}
            className={`${styles.navItem} ${activeTab === "county-municipality" ? styles.active : ""}`}
          >
            County / Municipal
          </Link>
          <Link
            href="/about"
            onClick={(e) => handleNavClick(e, "about")}
            className={`${styles.navItem} ${activeTab === "about" ? styles.active : ""}`}
          >
            About & Methodology
          </Link>
          {SHOW_TEST_API_NAV && (
            <Link
              href="/test-json"
              onClick={(e) => handleNavClick(e, "test-json")}
              className={`${styles.navItem} ${styles.debugLink} ${activeTab === "test-json" ? styles.active : ""}`}
            >
              Raw Data (API Test)
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
