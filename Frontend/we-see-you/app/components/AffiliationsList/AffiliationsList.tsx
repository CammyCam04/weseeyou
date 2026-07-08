"use client";

import { useState } from "react";
import styles from "./AffiliationsList.module.scss";

interface AffiliationsListProps {
  items: string[];
}

export default function AffiliationsList({ items }: AffiliationsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const limit = 10;

  if (!items || items.length === 0) {
    return <p className={styles.emptyMsg}>No affiliations recorded.</p>;
  }

  const hasMore = items.length > limit;
  const displayedItems = isExpanded ? items : items.slice(0, limit);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {displayedItems.map((aff, index) => (
          <li key={index} className={styles.listItem}>
            <span className={styles.bullet}>&bull;</span>
            <span>{aff}</span>
          </li>
        ))}
      </ul>
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleBtn}
        >
          {isExpanded ? "Show Less" : `Show More (${items.length - limit} more)`}
        </button>
      )}
    </div>
  );
}
