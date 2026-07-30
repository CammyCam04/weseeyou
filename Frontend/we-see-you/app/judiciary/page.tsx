"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import styles from "./judiciary.module.scss";
import { fetchJudges, JudgeBase } from "../../lib/api";
import Avatar from "../components/Avatar/Avatar";

export default function JudiciaryPage() {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [affiliationFilter, setAffiliationFilter] = useState<string>("ALL");
  const [judges, setJudges] = useState<JudgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJudges(query);
        setJudges(data);
      } catch (err: unknown) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : "An error occurred while loading judicial records.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const filteredJudges = judges.filter((j) => {
    const judgeLevel = (j as unknown as { level?: string }).level || "Federal";
    // Level filter
    if (levelFilter !== "ALL") {
      if (levelFilter === "Supreme Court" && judgeLevel !== "Supreme Court" && !j.court_name.includes("Supreme Court of the United States")) {
        return false;
      }
      if (levelFilter === "Federal" && judgeLevel !== "Federal" && !j.court_name.includes("Court of Appeals")) {
        return false;
      }
      if (levelFilter === "State" && judgeLevel !== "State" && !j.court_name.includes("California") && !j.court_name.includes("New York") && !j.court_name.includes("Texas") && !j.court_name.includes("Florida") && !j.court_name.includes("Ohio")) {
        return false;
      }
      if (levelFilter === "Local" && judgeLevel !== "Local" && !j.court_name.includes("Municipal") && !j.court_name.includes("County")) {
        return false;
      }
    }
    // Affiliation filter
    if (affiliationFilter !== "ALL") {
      const status = ((j as unknown as { registered_voting_status?: string }).registered_voting_status || "").toLowerCase();
      if (!status.includes(affiliationFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <span className={styles.eyebrow}>Independent Judicial Branch</span>
        <h1>Judiciary & Court Roster</h1>
        <p>
          Search official records for federal, state, and local court judges across the Supreme Court, Circuit Courts of Appeals, State Supreme Courts, and District Courts, including key opinions and jurisprudence.
        </p>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </span>
          <input
            type="text"
            placeholder="Search judges by name, court title (e.g. Supreme Court, Circuit), or state..."
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          {/* Court Level Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Court Level:</span>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${levelFilter === "ALL" ? styles.active : ""}`}
                onClick={() => setLevelFilter("ALL")}
              >
                All Courts
              </button>
              <button
                className={`${styles.filterBtn} ${levelFilter === "Supreme Court" ? styles.active : ""}`}
                onClick={() => setLevelFilter("Supreme Court")}
              >
                Supreme Court
              </button>
              <button
                className={`${styles.filterBtn} ${levelFilter === "Federal" ? styles.active : ""}`}
                onClick={() => setLevelFilter("Federal")}
              >
                Federal Circuit & District
              </button>
              <button
                className={`${styles.filterBtn} ${levelFilter === "State" ? styles.active : ""}`}
                onClick={() => setLevelFilter("State")}
              >
                State Courts
              </button>
              <button
                className={`${styles.filterBtn} ${levelFilter === "Local" ? styles.active : ""}`}
                onClick={() => setLevelFilter("Local")}
              >
                Local & Municipal
              </button>
            </div>
          </div>

          {/* Registered Voting Status Filter */}
          <div className={styles.filterWrapper}>
            <span className={styles.filterLabel}>Voter Registration Status:</span>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${affiliationFilter === "ALL" ? styles.active : ""}`}
                onClick={() => setAffiliationFilter("ALL")}
              >
                All Records
              </button>
              <button
                className={`${styles.filterBtn} ${affiliationFilter === "Democrat" ? styles.active : ""}`}
                onClick={() => setAffiliationFilter("Democrat")}
              >
                Democrat
              </button>
              <button
                className={`${styles.filterBtn} ${affiliationFilter === "Republican" ? styles.active : ""}`}
                onClick={() => setAffiliationFilter("Republican")}
              >
                Republican
              </button>
              <button
                className={`${styles.filterBtn} ${affiliationFilter === "Independent" ? styles.active : ""}`}
                onClick={() => setAffiliationFilter("Independent")}
              >
                Independent
              </button>
              <button
                className={`${styles.filterBtn} ${affiliationFilter === "Nonpartisan" ? styles.active : ""}`}
                onClick={() => setAffiliationFilter("Nonpartisan")}
              >
                Nonpartisan / Unaffiliated
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className={styles.status}>Loading verified judicial records...</div>}

      {error && <div className={`${styles.status} ${styles.error}`}>{error}</div>}

      {!loading && !error && filteredJudges.length === 0 && (
        <div className={styles.status}>No judicial records found matching the specified criteria.</div>
      )}

      {!loading && !error && filteredJudges.length > 0 && (
        <>
          <div className={styles.resultsMeta}>
            Showing {filteredJudges.length} judicial officer{filteredJudges.length === 1 ? "" : "s"}
          </div>
          <div className={styles.grid}>
            {filteredJudges.map((judge) => (
              <Link
                key={judge.id}
                href={`/judge/${judge.id}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <Avatar
                    src={judge.profile_image_url}
                    firstName={judge.first_name}
                    lastName={judge.last_name}
                    size="small"
                  />
                  <div>
                    <h2 className={styles.name}>
                      {judge.first_name} {judge.last_name}
                    </h2>
                    <p className={styles.title}>{judge.title}</p>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span>{judge.court_name}</span>
                  <span>State: <strong>{judge.state}</strong></span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
