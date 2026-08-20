"use client";

import { useState } from "react";
import styles from "./county-municipality-search.module.scss";
import {
  SearchTemplate,
  ComingSoonTemplate,
  BranchOption,
  FilterOption,
} from "../templates";

interface CountyMunicipalitySearchProps {
  onNavigateTab?: (tab: string) => void;
}

export default function CountyMunicipalitySearch({ onNavigateTab }: CountyMunicipalitySearchProps = {}) {
  const [activeBranch, setActiveBranch] = useState<string>("legislative");
  const [query, setQuery] = useState("");
  const [bodyFilter, setBodyFilter] = useState<string>("ALL");
  const [partyFilter, setPartyFilter] = useState<string>("ALL");

  const branchOptions: BranchOption[] = [
    { id: "legislative", label: "Local Legislative (City Councils & County Commissions)", shortLabel: "Councils" },
    { id: "executive", label: "Local Executive (Mayors & County Executives)", shortLabel: "Mayors" },
    { id: "judicial", label: "Local Courts (Municipal & County Courts)", shortLabel: "Courts" },
  ];

  const bodyOptions: FilterOption[] = [
    { id: "ALL", label: "All Bodies" },
    { id: "County", label: "County Commission" },
    { id: "City", label: "City Council / Board of Aldermen" },
    { id: "Township", label: "Township Board" },
  ];

  const partyOptions: FilterOption[] = [
    { id: "ALL", label: "All Affiliations" },
    { id: "NP", label: "Nonpartisan (Common in Local)" },
    { id: "D", label: "Democrat" },
    { id: "R", label: "Republican" },
    { id: "I", label: "Independent" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.heroSection}>
        <span className={styles.eyebrow}>Tier 3: County & Municipal Level</span>
        <h1>County & Municipality Portals</h1>
        <p>
          Search official records for local municipal councils, county commissioners, mayors, and
          local courts across 3,000+ U.S. counties and 19,000+ municipal jurisdictions.
        </p>
      </header>

      {/* Shared Reusable Search Template */}
      <SearchTemplate
        query={query}
        onQueryChange={setQuery}
        placeholder="Search local records by City, County, ZIP Code, or official name..."
        mobilePlaceholder="Search local records by City, County, ZIP..."
        branchOptions={branchOptions}
        activeBranch={activeBranch}
        onBranchChange={setActiveBranch}
        chamberOptions={activeBranch === "legislative" ? bodyOptions : undefined}
        activeChamber={bodyFilter}
        onChamberChange={setBodyFilter}
        chamberLabel="Body:"
        partyOptions={partyOptions}
        activeParty={partyFilter}
        onPartyChange={setPartyFilter}
      />


      {/* Local Legislative Tab */}
      {activeBranch === "legislative" && (
        <ComingSoonTemplate
          branchName="Local Legislative Bodies"
          title="City Councils & County Commissions"
          description="We are standardizing municipal open-data feeds to provide direct access to city council ward representatives, county commissioners, local municipal ordinances, and civic meeting agendas."
          upcomingFeatures={[
            "Ward and district resolution for city councilmembers and aldermen",
            "County board of commissioners and county supervisor rosters",
            "Local municipal voting records, ordinances, and zoning decisions",
            "City council meeting schedules, transcripts, and public comment registries",
          ]}
          backLink="/?tab=national"
          backLabel="Explore National Congress"
          onBack={() => (onNavigateTab ? onNavigateTab("national") : undefined)}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}

      {/* Local Executive Tab */}
      {activeBranch === "executive" && (
        <ComingSoonTemplate
          branchName="Local Executive Leadership"
          title="Mayors, City Managers & County Executives"
          description="We are connecting official municipal leadership records for city mayors, village presidents, city administrators, county executives, and county sheriffs."
          upcomingFeatures={[
            "Mayoral profiles across top 500 metropolitan areas",
            "Council-manager vs. strong-mayor municipal structure indicators",
            "County executives, county judges, sheriffs, and district attorneys",
            "Municipal executive directives and city department leadership",
          ]}
          backLink="/?tab=national"
          backLabel="Explore National Congress"
          onBack={() => (onNavigateTab ? onNavigateTab("national") : undefined)}
          onViewMethodology={() => (onNavigateTab ? onNavigateTab("about") : undefined)}
        />
      )}

      {/* Local Judicial Tab */}
      {activeBranch === "judicial" && (
        <ComingSoonTemplate
          branchName="Local & Municipal Courts"
          title="Municipal, County & District Courts"
          description="We are indexing local judicial rosters including municipal court judges, justice of the peace courts, county probate judges, and local district benches."
          upcomingFeatures={[
            "Municipal court and traffic bench magistrate listings",
            "County district court judges and judicial term expiration dates",
            "Local judicial retention election disclosures and ratings",
            "Jurisdictional boundaries for county and city court systems",
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

