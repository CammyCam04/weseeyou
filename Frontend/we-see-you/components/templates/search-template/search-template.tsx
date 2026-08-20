"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import styles from "./search-template.module.scss";

export interface BranchOption {
  id: string;
  label: string;
  shortLabel?: string;
  isLive?: boolean;
}

export interface FilterOption {
  id: string;
  label: string;
}

interface SearchTemplateProps {
  query: string;
  onQueryChange: (val: string) => void;
  placeholder?: string;
  mobilePlaceholder?: string;

  // Branch selector (e.g. Congressional, Executive, Judicial)
  branchOptions?: BranchOption[];
  activeBranch?: string;
  onBranchChange?: (branchId: string) => void;

  // Chamber filter (e.g. All, Senate, House)
  chamberOptions?: FilterOption[];
  activeChamber?: string;
  onChamberChange?: (chamberId: string) => void;
  chamberLabel?: string;

  // Party filter (e.g. All, Democrat, Republican, Independent, Nonpartisan)
  partyOptions?: FilterOption[];
  activeParty?: string;
  onPartyChange?: (partyId: string) => void;

  // Extra controls
  children?: React.ReactNode;
}

export default function SearchTemplate({
  query,
  onQueryChange,
  placeholder = "Search by name, state (e.g. CA, NY), or office title...",
  mobilePlaceholder,
  branchOptions,
  activeBranch,
  onBranchChange,
  chamberOptions,
  activeChamber,
  onChamberChange,
  chamberLabel = "Chamber:",
  partyOptions,
  activeParty,
  onPartyChange,
  children,
}: SearchTemplateProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePlaceholder = isMobile && mobilePlaceholder ? mobilePlaceholder : placeholder;

  return (
    <div className={styles.searchContainer}>
      {/* Branch Selector Tabs if provided */}
      {branchOptions && branchOptions.length > 0 && onBranchChange && (
        <div className={styles.branchSelector}>
          {branchOptions.map((opt) => {
            const isActive = activeBranch === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`${styles.branchBtn} ${isActive ? styles.activeBranch : ""}`}
                onClick={() => onBranchChange(opt.id)}
              >
                <span className={styles.branchLabelFull}>{opt.label}</span>
                <span className={styles.branchLabelShort}>{opt.shortLabel || opt.label}</span>
                {opt.isLive ? (
                  <span className={styles.liveTag}>Live</span>
                ) : (
                  <span className={styles.soonTag}>Soon</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Search Input */}
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>
          <HugeiconsIcon icon={Search01Icon} size={18} />
        </span>
        <input
          type="text"
          placeholder={activePlaceholder}
          className={styles.input}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />

        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onQueryChange("")}
            title="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      {((chamberOptions && chamberOptions.length > 0) ||
        (partyOptions && partyOptions.length > 0) ||
        children) && (
        <div className={styles.controlsRow}>
          <div className={styles.filterSection}>
            {/* Chamber / Sub-branch Filter */}
            {chamberOptions && chamberOptions.length > 0 && onChamberChange && (
              <div className={styles.filterWrapper}>
                <span className={styles.filterLabel}>{chamberLabel}</span>
                <div className={styles.filterGroup}>
                  {chamberOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.filterBtn} ${
                        activeChamber === opt.id ? styles.active : ""
                      }`}
                      onClick={() => onChamberChange(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Party Filter */}
            {partyOptions && partyOptions.length > 0 && onPartyChange && (
              <div className={styles.filterWrapper}>
                <span className={styles.filterLabel}>Party:</span>
                <div className={styles.filterGroup}>
                  {partyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.filterBtn} ${
                        activeParty === opt.id ? styles.active : ""
                      }`}
                      onClick={() => onPartyChange(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {children && <div>{children}</div>}
        </div>
      )}
    </div>
  );
}
