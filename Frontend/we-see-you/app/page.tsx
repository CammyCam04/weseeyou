"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import styles from "./page.module.scss";
import { fetchPoliticians, PoliticianSearchItem } from "../lib/api";
import Avatar from "./components/Avatar/Avatar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("ALL");
  const [chamberFilter, setChamberFilter] = useState<string>("ALL");
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
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const partyClasses: Record<string, string> = {
    D: styles.badgeD,
    R: styles.badgeR,
    I: styles.badgeI,
  };

  const partyLabels: Record<string, string> = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
  };

  const filteredPoliticians = politicians.filter((p) => {
    // Party filter
    if (partyFilter !== "ALL" && p.party !== partyFilter) {
      return false;
    }
    // Chamber / Branch filter
    if (chamberFilter !== "ALL" && p.chamber !== chamberFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <span className={styles.eyebrow}>Official Federal Roster</span>
        <h1>National Politicians</h1>
        <p>
          Search official records for national U.S. leaders across the Senate, House of Representatives, and Executive Branch, including committee assignments and campaign finance disclosures.
        </p>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name, state (e.g. CA, NY), or office title..."
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          {/* Chamber / Branch Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Chamber:</span>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${chamberFilter === "ALL" ? styles.active : ""}`}
                onClick={() => setChamberFilter("ALL")}
              >
                All Chambers
              </button>
              <button
                className={`${styles.filterBtn} ${chamberFilter === "Senate" ? styles.active : ""}`}
                onClick={() => setChamberFilter("Senate")}
              >
                Senate
              </button>
              <button
                className={`${styles.filterBtn} ${chamberFilter === "House" ? styles.active : ""}`}
                onClick={() => setChamberFilter("House")}
              >
                House
              </button>
              <button
                className={`${styles.filterBtn} ${chamberFilter === "Executive" ? styles.active : ""}`}
                onClick={() => setChamberFilter("Executive")}
              >
                Executive
              </button>
            </div>
          </div>

          {/* Party Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Party:</span>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${partyFilter === "ALL" ? styles.active : ""}`}
                onClick={() => setPartyFilter("ALL")}
              >
                All Parties
              </button>
              <button
                className={`${styles.filterBtn} ${partyFilter === "D" ? styles.active : ""}`}
                onClick={() => setPartyFilter("D")}
              >
                Democrat
              </button>
              <button
                className={`${styles.filterBtn} ${partyFilter === "R" ? styles.active : ""}`}
                onClick={() => setPartyFilter("R")}
              >
                Republican
              </button>
              <button
                className={`${styles.filterBtn} ${partyFilter === "I" ? styles.active : ""}`}
                onClick={() => setPartyFilter("I")}
              >
                Independent
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className={styles.status}>Loading verified national records...</div>}

      {error && <div className={`${styles.status} ${styles.error}`}>{error}</div>}

      {!loading && !error && filteredPoliticians.length === 0 && (
        <div className={styles.status}>No national politicians found matching the specified criteria.</div>
      )}

      {!loading && !error && filteredPoliticians.length > 0 && (
        <>
          <div className={styles.resultsMeta}>
            Showing {filteredPoliticians.length} national politician{filteredPoliticians.length === 1 ? "" : "s"}
          </div>
          <div className={styles.grid}>
            {filteredPoliticians.map((person) => {
              const href = person.chamber === "Judicial" ? `/judge/${person.id}` : `/profile/${person.id}`;
              return (
                <Link
                  key={person.id}
                  href={href}
                  className={styles.card}
                >
                <div className={styles.cardTop}>
                  <Avatar
                    src={person.profile_image_url}
                    firstName={person.first_name}
                    lastName={person.last_name}
                    size="small"
                  />
                  <div>
                    <h2 className={styles.name}>
                      {person.first_name} {person.last_name}
                    </h2>
                    <p className={styles.title}>{person.title}</p>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span>State: <strong>{person.state}</strong></span>
                  <span className={partyClasses[person.party] || partyClasses.I}>
                    {partyLabels[person.party] || partyLabels.I}
                  </span>
                </div>
              </Link>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
