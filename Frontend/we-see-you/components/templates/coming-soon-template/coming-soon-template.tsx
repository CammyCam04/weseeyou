"use client";

import React from "react";
import Link from "next/link";
import styles from "./coming-soon-template.module.scss";

interface ComingSoonProps {
  branchName: string;
  title: string;
  description: string;
  upcomingFeatures?: string[];
  backLink?: string;
  backLabel?: string;
}

export default function ComingSoonTemplate({
  branchName,
  title,
  description,
  upcomingFeatures = [
    "Verified official roster and district boundary mapping",
    "OpenSecrets & state campaign finance donor records",
    "Legislative voting history and committee assignments",
    "Official executive actions and administrative disclosures",
  ],
  backLink = "/",
  backLabel = "Return to National Congress",
}: ComingSoonProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badgeRow}>
          <span className={styles.statusBadge}>
            <span className={styles.pulseDot} /> Under Active Development
          </span>
          <span className={styles.branchTag}>{branchName}</span>
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        {upcomingFeatures && upcomingFeatures.length > 0 && (
          <div className={styles.featureBox}>
            <h3>Integration Roadmap:</h3>
            <ul>
              {upcomingFeatures.map((feat, idx) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actionRow}>
          <Link href={backLink} className={styles.primaryBtn}>
            {backLabel}
          </Link>
          <Link href="/about" className={styles.secondaryBtn}>
            View Data Sources & Methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
