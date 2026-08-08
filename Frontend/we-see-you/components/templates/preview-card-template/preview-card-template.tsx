"use client";

import React from "react";
import Link from "next/link";
import styles from "./preview-card-template.module.scss";
import Avatar from "../avatar/avatar";

export interface PreviewCardProps {
  id: string;
  href?: string;
  onSelect?: (id: string) => void;
  firstName: string;
  lastName: string;
  title: string;
  state?: string;
  jurisdiction?: string;
  party: string;
  chamber?: string;
  profileImageUrl?: string;
  badgeLabel?: string;
}

export default function PreviewCardTemplate({
  id,
  href,
  onSelect,
  firstName,
  lastName,
  title,
  state,
  jurisdiction,
  party,
  chamber,
  profileImageUrl,
  badgeLabel,
}: PreviewCardProps) {
  const targetHref = href || (chamber === "Judicial" ? `/judge/${id}` : `/profile/${id}`);

  const partyClasses: Record<string, string> = {
    D: styles.badgeD,
    R: styles.badgeR,
    I: styles.badgeI,
    NP: styles.badgeNP,
  };

  const partyLabels: Record<string, string> = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
    NP: "Nonpartisan",
  };

  const displayPartyClass = partyClasses[party] || styles.badgeNP;
  const displayPartyLabel = badgeLabel || partyLabels[party] || party || "Independent";
  const displayLocation = state || jurisdiction || "U.S.";

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <Link href={targetHref} onClick={handleClick} className={styles.card}>
      <div className={styles.cardTop}>
        <Avatar
          src={profileImageUrl}
          firstName={firstName}
          lastName={lastName}
          size="small"
        />
        <div className={styles.personInfo}>
          <h2 className={styles.name}>
            {firstName} {lastName}
          </h2>
          <p className={styles.title}>{title}</p>
        </div>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.location}>
          State/Region: <strong>{displayLocation}</strong>
        </span>
        <span className={`${styles.badge} ${displayPartyClass}`}>
          {displayPartyLabel}
        </span>
      </div>
    </Link>
  );
}
