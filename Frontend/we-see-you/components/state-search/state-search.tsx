"use client";

import { useState } from "react";
import styles from "./state-search.module.scss";
import {
  SearchTemplate,
  ComingSoonTemplate,
  BranchOption,
  FilterOption,
} from "../templates";

interface StateSearchProps {
  onNavigateTab?: (tab: string) => void;
}

export default function StateSearch({ onNavigateTab }: StateSearchProps = {}) {
  const [activeBranch, setActiveBranch] = useState<string>("legislative");
  const [query, setQuery] = useState("");
  const [chamberFilter, setChamberFilter] = useState<string>("ALL");
  const [partyFilter, setPartyFilter] = useState<string>("ALL");

  const branchOptions: BranchOption[] = [
    { id: "legislative", label: "State Legislature (Senate & Assembly)", shortLabel: "Legislature" },
    { id: "executive", label: "Executive (Governors & State Cabinet)", shortLabel: "Exec/Gov" },
    { id: "judicial", label: "Judicial (State Supreme Courts)", shortLabel: "Courts" },
  ];

  const chamberOptions: FilterOption[] = [
    { id: "ALL", label: "All Chambers" },
    { id: "Senate", label: "State Senate" },
    { id: "House", label: "State Assembly / House" },
  ];

  const partyOptions: FilterOption[] = [
    { id: "ALL", label: "All Parties" },
    { id: "D", label: "Democrat" },
    { id: "R", label: "Republican" },
    { id: "I", label: "Independent" },
    { id: "NP", label: "Nonpartisan" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <span className={styles.eyebrow}>Tier 2: State Level</span>
        <h1>State Government Portals</h1>
        <p>
          Search official records for state legislators, governors, and state supreme court justices
          across all 50 states and U.S. territories.
        </p>
      </header>

      {/* Shared Reusable Search Template */}
      <SearchTemplate
        query={query}
        onQueryChange={setQuery}
        placeholder="Search state leaders by name, state (e.g. TX, FL, NY), or office title..."
        mobilePlaceholder="Search state leaders by name, state..."
        branchOptions={branchOptions}
        activeBranch={activeBranch}
        onBranchChange={setActiveBranch}
        chamberOptions={activeBranch === "legislative" ? chamberOptions : undefined}
        activeChamber={chamberFilter}
        onChamberChange={setChamberFilter}
        chamberLabel="Chamber:"
        partyOptions={partyOptions}
        activeParty={partyFilter}
        onPartyChange={setPartyFilter}
      />


      {/* Legislative Branch Tab */}
      {activeBranch === "legislative" && (
        <ComingSoonTemplate
          branchName="State Legislative Branch"
          title="50 State Legislatures & General Assemblies"
          description="We are actively integrating OpenStates and official state legislative feeds to bring you real-time state senator and representative voting records, sponsored state bills, and committee rosters."
          upcomingFeatures={[
            "Full roster coverage across 50 State Senates and State Houses / Assemblies",
            "State-level sponsored legislation and committee assignments",
            "State campaign finance donor disclosures via FollowTheMoney.org",
            "State legislative district map overlays and boundaries",
          ]}
          backLink="/?tab=national"
          backLabel="Explore National Congress"
          onBack={() => (onNavigateTab ? onNavigateTab("national") : undefined)}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}

      {/* Executive Branch Tab */}
      {activeBranch === "executive" && (
        <ComingSoonTemplate
          branchName="State Executive Branch"
          title="Governors & State Executive Cabinets"
          description="We are compiling verified administrative records for Governors, Lieutenant Governors, Attorneys General, and Secretaries of State."
          upcomingFeatures={[
            "All 50 State Governors, Lieutenant Governors, and Attorneys General",
            "State executive orders, budget proposals, and veto histories",
            "Gubernatorial campaign finance and independent expenditure tracking",
            "Cabinet department directories and administrative appointments",
          ]}
          backLink="/?tab=national"
          backLabel="Explore National Congress"
          onBack={() => (onNavigateTab ? onNavigateTab("national") : undefined)}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}

      {/* Judicial Branch Tab */}
      {activeBranch === "judicial" && (
        <ComingSoonTemplate
          branchName="State Judicial Branch"
          title="State Supreme Courts & Appellate Benches"
          description="We are structuring verified records for state supreme court justices, appellate judges, and state judicial appointment & retention election cycles."
          upcomingFeatures={[
            "Chief Justices and Associate Justices across all 50 State Supreme Courts",
            "Judicial election types (gubernatorial appointment, retention elections, nonpartisan ballots)",
            "Key constitutional rulings and state court jurisprudence",
            "Judicial tenure, terms, and mandatory retirement ages",
          ]}
          backLink="/?tab=national"
          backLabel="Explore National Congress"
          onBack={() => (onNavigateTab ? onNavigateTab("national") : undefined)}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}
    </div>
  );
}

