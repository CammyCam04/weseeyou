"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";
import { fetchPoliticians, PoliticianSearchItem } from "../lib/api";
import Avatar from "./components/Avatar/Avatar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [politicians, setPoliticians] = useState<PoliticianSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPoliticians(query);
        setPoliticians(data);
      } catch (err: unknown) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : "An error occurred while fetching data.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search to prevent excessive API requests

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const partyClasses: Record<string, string> = {
    D: `${styles.badge} ${styles.badgeD}`,
    R: `${styles.badge} ${styles.badgeR}`,
    I: `${styles.badge} ${styles.badgeI}`,
  };

  const partyLabels: Record<string, string> = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>We See You</h1>
        <p>Find and track current U.S. politicians, their sponsored legislation, and campaign finance history.</p>
      </header>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search by name, state, party, or title..."
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <div className={styles.status}>Searching database...</div>}

      {error && <div className={`${styles.status} ${styles.error}`}>{error}</div>}

      {!loading && !error && politicians.length === 0 && (
        <div className={styles.status}>No politicians found matching your search.</div>
      )}

      {!loading && !error && politicians.length > 0 && (
        <div className={styles.grid}>
          {politicians.map((person) => (
            <Link
              key={person.id}
              href={`/profile/${person.id}`}
              className={styles.card}
            >
              <Avatar
                src={person.profile_image_url}
                firstName={person.first_name}
                lastName={person.last_name}
                size="small"
              />
              <h2 className={styles.name}>
                {person.first_name} {person.last_name}
              </h2>
              <p className={styles.details}>
                {person.title} &bull; {person.state}
              </p>
              <span className={partyClasses[person.party] || partyClasses.I}>
                {partyLabels[person.party] || partyLabels.I}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
