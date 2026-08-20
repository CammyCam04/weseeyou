"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./preview-card-template.module.scss";
import Avatar from "../avatar/avatar";
import { prefetchPolitician } from "@/lib/api";

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
  const cardRef = useRef<HTMLAnchorElement>(null);
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

  // Immediate manual prefetch handler for mouse hover / focus
  const handlePrefetch = () => {
    if (id) {
      prefetchPolitician(id);
    }
  };

  // Viewport Dwell Prefetching for Mobile & Desktop (300ms buffer timer)
  useEffect(() => {
    if (!id || typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Card entered visible viewport: start 100ms buffer timer before prefetching
            timer = setTimeout(() => {
              prefetchPolitician(id);
            }, 100);
          } else {
            // Card scrolled out of viewport: cancel pending prefetch timer if user scrolled past fast
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
          }
        });
      },
      { threshold: 0.15 } // Trigger when card enters viewport
    );

    const currentEl = cardRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [id]);

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <Link
      ref={cardRef}
      href={targetHref}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      onTouchStart={handlePrefetch}
      onFocus={handlePrefetch}
      className={styles.card}
    >
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
