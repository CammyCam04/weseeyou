"use client";

import { useEffect, useState } from "react";
import styles from "./national-search.module.scss";
import { fetchPoliticians, PoliticianSearchItem } from "@/lib/api";
import {
  SearchTemplate,
  PreviewCardTemplate,
  ComingSoonTemplate,
  BranchOption,
  FilterOption,
} from "../templates";

interface NationalSearchProps {
  onSelectPolitician?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function NationalSearch({ onSelectPolitician, onNavigateTab }: NationalSearchProps) {
  const [activeBranch, setActiveBranch] = useState<string>("congressional");
  const [query, setQuery] = useState("");
  const [chamberFilter, setChamberFilter] = useState<string>("ALL");
  const [partyFilter, setPartyFilter] = useState<string>("ALL");
  const [politicians, setPoliticians] = useState<PoliticianSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBranch !== "congressional") return;

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPoliticians(query);
        setPoliticians(data);
      } catch (err: unknown) {
        console.error(err);
        const errorMsg =
          err instanceof Error ? err.message : "An error occurred while fetching national data.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, activeBranch]);

  // Branch options for National level
  const branchOptions: BranchOption[] = [
    { id: "congressional", label: "Congressional (Senate & House)", shortLabel: "Congress", isLive: true },
    { id: "executive", label: "Executive (Presidency & Cabinet)", shortLabel: "Executive" },
    { id: "judicial", label: "Judicial (Federal Courts)", shortLabel: "Judicial" },
  ];

  // Chamber options for Congress
  const chamberOptions: FilterOption[] = [
    { id: "ALL", label: "All Chambers" },
    { id: "Senate", label: "Senate" },
    { id: "House", label: "House" },
  ];

  // Party options
  const partyOptions: FilterOption[] = [
    { id: "ALL", label: "All Parties" },
    { id: "D", label: "Democrat" },
    { id: "R", label: "Republican" },
    { id: "I", label: "Independent" },
  ];

  const filteredPoliticians = politicians.filter((p) => {
    // Only include Congressional members (Senate & House) on the Congressional page
    if (p.chamber !== "Senate" && p.chamber !== "House") {
      return false;
    }
    if (partyFilter !== "ALL" && p.party !== partyFilter) {
      return false;
    }
    if (chamberFilter !== "ALL" && p.chamber !== chamberFilter) {
      return false;
    }
    return true;
  });


  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <span className={styles.eyebrow}>Tier 1: Federal Level</span>
        <h1>National Government</h1>
        <p>
          Search official records for national U.S. leaders across the Senate and House of
          Representatives, with Executive and Federal Judicial rosters actively being integrated.
        </p>
      </header>

      {/* Shared Reusable Search Template */}
      <SearchTemplate
        query={query}
        onQueryChange={setQuery}
        placeholder="Search national politicians by name, state (e.g. CA, NY), or title..."
        mobilePlaceholder="Search national politicians by name, state..."
        branchOptions={branchOptions}
        activeBranch={activeBranch}
        onBranchChange={setActiveBranch}
        chamberOptions={activeBranch === "congressional" ? chamberOptions : undefined}
        activeChamber={chamberFilter}
        onChamberChange={setChamberFilter}
        chamberLabel="Chamber:"
        partyOptions={activeBranch === "congressional" ? partyOptions : undefined}
        activeParty={partyFilter}
        onPartyChange={setPartyFilter}
      />


      {/* Congressional Branch (Live) */}
      {activeBranch === "congressional" && (
        <>
          {loading && <div className={styles.status}>Loading verified congressional records...</div>}

          {error && <div className={`${styles.status} ${styles.error}`}>{error}</div>}

          {!loading && !error && filteredPoliticians.length === 0 && (
            <div className={styles.status}>
              No national politicians found matching the specified criteria.
            </div>
          )}

          {!loading && !error && filteredPoliticians.length > 0 && (
            <>
              <div className={styles.resultsMeta}>
                Showing {filteredPoliticians.length} verified national legislator
                {filteredPoliticians.length === 1 ? "" : "s"}
              </div>
              <div className={styles.grid}>
                {filteredPoliticians.map((person) => (
                  <PreviewCardTemplate
                    key={person.id}
                    id={person.id}
                    onSelect={onSelectPolitician}
                    firstName={person.first_name}
                    lastName={person.last_name}
                    title={person.title}
                    state={person.state}
                    party={person.party}
                    chamber={person.chamber}
                    profileImageUrl={person.profile_image_url}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Executive Branch (Coming Soon) */}
      {activeBranch === "executive" && (
        <ComingSoonTemplate
          branchName="Federal Executive Branch"
          title="National Executive & Cabinet Roster"
          description="We are compiling verified records for the Executive Office of the President, Vice Presidency, Cabinet Department Secretaries, and independent federal agencies."
          upcomingFeatures={[
            "Live FEC campaign filing histories for presidential & vice-presidential campaigns",
            "Confirmed executive branch leadership and department jurisdictions",
            "Official executive orders and administrative policy records",
            "Financial disclosure statements and conflict-of-interest filings",
          ]}
          backLink="/?tab=national"
          backLabel="Return to Congressional Roster"
          onBack={() => setActiveBranch("congressional")}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}

      {/* Judicial Branch (Coming Soon) */}
      {activeBranch === "judicial" && (
        <ComingSoonTemplate
          branchName="Federal Judicial Branch"
          title="Supreme Court & Federal Judiciary"
          description="We are structuring verified records for the U.S. Supreme Court, Federal Circuit Courts of Appeals, and Federal District Courts."
          upcomingFeatures={[
            "Supreme Court Justice biographies, appointment timelines, and confirmation votes",
            "Federal appellate bench rosters across all 13 federal circuits",
            "Majority opinions, landmark dissents, and jurisprudential history",
            "Judicial financial disclosures and recusal registries",
          ]}
          backLink="/?tab=national"
          backLabel="Return to Congressional Roster"
          onBack={() => setActiveBranch("congressional")}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}
    </div>
  );
}

