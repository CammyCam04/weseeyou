"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./committees.module.scss";
import { fetchCommittees, CommitteeSearchItem } from "../../lib/api";

export default function CommitteesPage() {
  const [query, setQuery] = useState("");
  const [chamber, setChamber] = useState<string>("all");
  const [committees, setCommittees] = useState<CommitteeSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const chamberParam = chamber === "all" ? undefined : chamber;
        const data = await fetchCommittees(query, chamberParam);
        setCommittees(data);
      } catch (err: unknown) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : "An error occurred while fetching committees.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, chamber]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Congressional Committees & Groups</h1>
        <p>Explore official House, Senate, and Joint committees, their active leadership rosters, subcommittees, and recent proposed legislation.</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search committees by name (e.g. Foreign Relations, Agriculture, Finance)..."
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${chamber === "all" ? styles.active : ""}`}
            onClick={() => setChamber("all")}
          >
            All
          </button>
          <button
            className={`${styles.tab} ${chamber === "house" ? styles.active : ""}`}
            onClick={() => setChamber("house")}
          >
            House
          </button>
          <button
            className={`${styles.tab} ${chamber === "senate" ? styles.active : ""}`}
            onClick={() => setChamber("senate")}
          >
            Senate
          </button>
          <button
            className={`${styles.tab} ${chamber === "joint" ? styles.active : ""}`}
            onClick={() => setChamber("joint")}
          >
            Joint
          </button>
        </div>
      </div>

      {loading && <div className={styles.status}>Loading committees dataset...</div>}
      {error && <div className={styles.status}>{error}</div>}

      {!loading && !error && committees.length === 0 && (
        <div className={styles.status}>No committees found matching your filter criteria.</div>
      )}

      {!loading && !error && committees.length > 0 && (
        <div className={styles.grid}>
          {committees.map((comm) => (
            <Link key={comm.id} href={`/committees/${comm.id}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles[comm.type] || styles.house}`}>
                  {comm.type}
                </span>
              </div>
              <h2 className={styles.name}>{comm.name}</h2>

              <div className={styles.leadership}>
                {comm.chair_name && (
                  <div>
                    Chair: <strong>{comm.chair_name}</strong>
                  </div>
                )}
                {comm.ranking_member_name && (
                  <div>
                    Ranking Member: <strong>{comm.ranking_member_name}</strong>
                  </div>
                )}
              </div>

              <div className={styles.footerStats}>
                <span>{comm.member_count} Members</span>
                <span>{comm.subcommittee_count} Subcommittees</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
