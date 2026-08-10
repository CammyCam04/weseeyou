"use client";

import { useState } from "react";
import styles from "./pac-breakdown.module.scss";
import { PacItem } from "@/lib/api";

interface PacBreakdownProps {
  pacs?: PacItem[];
  superPacs?: PacItem[];
}

export default function PacBreakdown({ pacs = [], superPacs = [] }: PacBreakdownProps) {
  const [activeTab, setActiveTab] = useState<"all" | "pacs" | "superPacs">("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const allItems = [...pacs, ...superPacs].sort((a, b) => b.amount - a.amount);
  const displayItems =
    activeTab === "all" ? allItems : activeTab === "pacs" ? pacs : superPacs;

  const maxAmount = Math.max(...allItems.map((i) => i.amount), 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Itemized PAC & Super PAC Contributions</h3>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "all" ? styles.active : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All PAC Groups ({allItems.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "pacs" ? styles.active : ""}`}
          onClick={() => setActiveTab("pacs")}
        >
          Traditional PACs ({pacs.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "superPacs" ? styles.active : ""}`}
          onClick={() => setActiveTab("superPacs")}
        >
          Super PACs & Action Funds ({superPacs.length})
        </button>
      </div>

      {displayItems.length > 0 ? (
        <div className={styles.pacList}>
          {displayItems.map((item, idx) => {
            const isSuper = item.type.toLowerCase().includes("super");
            const fillPct = Math.min(100, Math.max(5, (item.amount / maxAmount) * 100));

            return (
              <div key={idx} className={styles.pacItem}>
                <div className={styles.pacTop}>
                  <span className={styles.pacName}>{item.name}</span>
                  <span className={styles.pacAmount}>{formatCurrency(item.amount)}</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={`${styles.progressBarFill} ${isSuper ? styles.superFill : ""}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <div className={styles.pacMeta}>
                  <span>Type: {item.type}</span>
                  <span>Direct FEC Filing</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem" }}>
          No itemized PAC contributions found for this cycle.
        </p>
      )}
    </div>
  );
}
