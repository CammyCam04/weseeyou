"use client";

import React, { useState } from "react";
import styles from "./affiliations-list.module.scss";

export interface AffiliationsListProps {
  items: string[];
}

interface ParsedAffiliation {
  code?: string;
  mainName: string;
  subName?: string;
  role?: string;
  raw: string;
}

function parseAffiliation(str: string): ParsedAffiliation {
  // Format: "Committee CODE -- Committee Name (Role)" or "Committee CODE -- Committee Name"
  const commRegex = /^Committee\s+([A-Z0-9]+)\s*--\s*(.+?)(?:\s*\(([^)]+)\))?$/i;
  const match = str.match(commRegex);

  if (match) {
    const code = match[1];
    const fullText = match[2].trim();
    const role = match[3]?.trim();

    if (fullText.includes(": Subcommittee on ")) {
      const [parent, sub] = fullText.split(": Subcommittee on ");
      return {
        code,
        mainName: parent.trim(),
        subName: `Subcommittee on ${sub.trim()}`,
        role,
        raw: str,
      };
    }

    return {
      code,
      mainName: fullText,
      role,
      raw: str,
    };
  }

  // Check if there's a trailing role in parentheses e.g. "Executive Branch Officer (Secretary of State)"
  const parenMatch = str.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    return {
      mainName: parenMatch[1].trim(),
      role: parenMatch[2].trim(),
      raw: str,
    };
  }

  return {
    mainName: str,
    raw: str,
  };
}

export default function AffiliationsList({ items }: AffiliationsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const limit = 8;

  if (!items || items.length === 0) {
    return <p className={styles.emptyMsg}>No affiliations recorded.</p>;
  }

  const hasMore = items.length > limit;
  const displayedItems = isExpanded ? items : items.slice(0, limit);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {displayedItems.map((aff, index) => {
          const parsed = parseAffiliation(aff);
          const roleLower = parsed.role?.toLowerCase() || "";
          const roleClass = roleLower.includes("chair")
            ? styles.chair
            : roleLower.includes("ranking")
            ? styles.ranking
            : roleLower.includes("officer") || roleLower.includes("secretary")
            ? styles.officer
            : styles.defaultRole;

          return (
            <li key={index} className={styles.listItem}>
              <div className={styles.itemLeft}>
                {parsed.code ? (
                  <span className={styles.codeBadge} title={`Congressional Committee Designation: ${parsed.code}`}>
                    {parsed.code}
                  </span>
                ) : (
                  <span className={styles.bullet}>&bull;</span>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span className={styles.committeeName}>{parsed.mainName}</span>
                  {parsed.subName && (
                    <span className={styles.subcommitteePart}>
                      &bull; {parsed.subName}
                    </span>
                  )}
                </div>
              </div>

              {parsed.role && (
                <span className={`${styles.roleBadge} ${roleClass}`}>
                  {parsed.role}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleBtn}
        >
          {isExpanded ? "Show Less" : `Show More (${items.length - limit} more)`}
        </button>
      )}
    </div>
  );
}
