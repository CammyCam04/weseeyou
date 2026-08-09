"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@hugeicons/core-free-icons";
import styles from "./profile-template.module.scss";
import { PoliticianDetail, FinanceSummary, SponsoredLegislationItem, TermHistoryItem } from "@/lib/api";
import Avatar from "../avatar/avatar";
import FinanceChart from "../finance-chart/finance-chart";
import AffiliationsList from "../affiliations-list/affiliations-list";

interface ProfileTemplateProps {
  politician?: PoliticianDetail | null;
  finance?: Record<string, FinanceSummary> | null;
  errorMsg?: string | null;
  backLink?: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function ProfileTemplate({
  politician,
  finance,
  errorMsg,
  backLink = "/",
  backLabel = "Back to Search",
  onBack,
}: ProfileTemplateProps) {
  const [isTermsExpanded, setIsTermsExpanded] = useState<boolean>(false);

  const handleBackClick = (e: React.MouseEvent) => {
    if (onBack) {
      e.preventDefault();
      onBack();
    }
  };

  if (errorMsg || !politician) {
    return (
      <div className={styles.statusContainer}>
        <h2>Profile Not Found</h2>
        <p>{errorMsg || "The politician you are looking for does not exist in our records."}</p>
        <Link href={backLink} onClick={handleBackClick} className={styles.backLink}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> {backLabel}
        </Link>
      </div>
    );
  }

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

  const getAge = (dobString?: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? null : age;
  };

  const age = getAge(politician.date_of_birth);
  const terms = politician.terms_history || [];
  const displayTerms = isTermsExpanded ? terms : terms.slice(0, 4);

  return (
    <div className={styles.container}>
      <Link href={backLink} onClick={handleBackClick} className={styles.backLink}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> {backLabel}
      </Link>

      <div className={styles.layout}>
        {/* Left Column: Sidebar Card */}
        <aside className={styles.sidebar}>
          <Avatar
            src={politician.profile_image_url}
            firstName={politician.first_name}
            lastName={politician.last_name}
            size="large"
          />

          <span className={partyClasses[politician.party] || styles.badgeI}>
            {partyLabels[politician.party] || politician.party || "Independent"}
          </span>

          <h1 className={styles.name}>
            {politician.first_name} {politician.last_name}
          </h1>
          <p className={styles.title}>
            {politician.title} &bull; {politician.state}
          </p>

          <div className={styles.divider} />

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Current Chamber:</span>
              <span className={styles.value}>{politician.chamber}</span>
            </div>

            {politician.has_multi_chamber_history && politician.career_chambers && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Career Chambers:</span>
                <span className={styles.value}>
                  {politician.career_chambers.join(" & ")}
                </span>
              </div>
            )}

            {politician.date_of_birth && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Born:</span>
                <span className={styles.value}>
                  {politician.date_of_birth} {age ? `(${age} yrs old)` : ""}
                </span>
              </div>
            )}

            {politician.gender && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Gender:</span>
                <span className={styles.value}>
                  {politician.gender === "M" ? "Male" : politician.gender === "F" ? "Female" : politician.gender}
                </span>
              </div>
            )}

            <div className={styles.infoItem}>
              <span className={styles.label}>Next Election:</span>
              <span className={styles.value}>{politician.next_election || "N/A"}</span>
            </div>
          </div>

          {/* Sidebar Career Chambers Summary if multi-chamber */}
          {politician.has_multi_chamber_history && politician.career_chambers && (
            <>
              <div className={styles.divider} />
              <div className={styles.careerChambersGroup}>
                <span className={styles.label} style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Chamber Tenure:
                </span>
                <div className={`${styles.careerChamberChip} ${styles.activeChip}`}>
                  <span>U.S. {politician.chamber}</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>Current</span>
                </div>
                {politician.career_chambers
                  .filter((c) => c !== politician.chamber)
                  .map((c) => (
                    <div key={c} className={styles.careerChamberChip}>
                      <span>U.S. {c}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--foreground-muted)" }}>Prior</span>
                    </div>
                  ))}
              </div>
            </>
          )}

          <div className={styles.divider} />

          {/* Official & Social Links */}
          <div className={styles.socialGrid}>
            {politician.website_url && (
              <a
                href={politician.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                Official Site
              </a>
            )}
            {politician.twitter_account && (
              <a
                href={`https://twitter.com/${politician.twitter_account}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                Twitter/X
              </a>
            )}
            {politician.facebook_account && (
              <a
                href={`https://facebook.com/${politician.facebook_account}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                Facebook
              </a>
            )}
            {politician.youtube_account && (
              <a
                href={`https://youtube.com/user/${politician.youtube_account}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                YouTube
              </a>
            )}
          </div>
        </aside>

        {/* Right Column: Main Content Details */}
        <main className={styles.mainContent}>
          {/* Biography & Career Overview */}
          {politician.bio_summary && (
            <section className={styles.section}>
              <h2>Biography & Career Overview</h2>
              <p>{politician.bio_summary}</p>
            </section>
          )}

          {/* Congressional Service & Chamber Tenure History */}
          {terms.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Congressional Service & Tenure History</h2>
                {terms.length > 4 && (
                  <button
                    type="button"
                    className={styles.guideLink}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    onClick={() => setIsTermsExpanded(!isTermsExpanded)}
                  >
                    {isTermsExpanded ? (
                      <>
                        Show Recent Terms <HugeiconsIcon icon={ChevronUpIcon} size={14} />
                      </>
                    ) : (
                      <>
                        View All {terms.length} Terms <HugeiconsIcon icon={ChevronDownIcon} size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Multi-Chamber Callout Notice */}
              {politician.has_multi_chamber_history && (
                <div className={styles.multiChamberCallout}>
                  <div className={styles.calloutContent}>
                    <h4>Multi-Chamber Legislative History</h4>
                    <p>
                      {politician.first_name} {politician.last_name} has served across multiple chambers in the United States Congress ({politician.career_chambers?.join(" and ")}). While current focus remains on their active term, you can use the Chamber Toggle in the Campaign Finance section below to explore their financial history by individual chamber or across their complete career.
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.termsList}>
                {displayTerms.map((term: TermHistoryItem, idx: number) => (
                  <div
                    key={idx}
                    className={`${styles.termItem} ${term.is_current ? styles.activeTermItem : ""}`}
                  >
                    <div className={styles.termLeft}>
                      <span className={styles.termTitle}>{term.title}</span>
                      <span className={styles.termChamber}>
                        Chamber: U.S. {term.chamber} {term.district ? `(District ${term.district})` : ""} &bull; {term.state}
                      </span>
                    </div>
                    <div className={styles.termRight}>
                      <span className={styles.termYears}>
                        {term.start_year} – {term.is_current ? "Present" : term.end_year}
                      </span>
                      <span
                        className={`${styles.termStatusPill} ${
                          term.is_current ? styles.activeStatus : styles.pastStatus
                        }`}
                      >
                        {term.is_current ? "Active Term" : "Prior Service"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sponsored Legislation */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Recently Sponsored Legislation</h2>
              <Link href="/about#bill-guide" className={styles.guideLink}>
                <HugeiconsIcon icon={InformationCircleIcon} size={16} /> Bill Types Guide
              </Link>
            </div>
            {politician.sponsored_legislation && politician.sponsored_legislation.length > 0 ? (
              <ul className={styles.billList}>
                {politician.sponsored_legislation.map((bill: SponsoredLegislationItem, index: number) => (
                  <li key={index} className={styles.billItem}>
                    <span className={styles.billBullet}>&bull;</span>
                    <div className={styles.billContent}>
                      <a
                        href={bill.congress_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.billLink}
                      >
                        <strong>{bill.bill_number}</strong>: {bill.title}
                      </a>
                      <span className={styles.billMeta}>
                        (Introduced: {bill.introduced_date}) &bull; {bill.latest_action}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recently sponsored legislation recorded for this politician yet.</p>
            )}
          </section>

          {/* Campaign Finance Breakdown & Multi-Chamber History */}
          {finance && (
            <section className={styles.section}>
              <h2>Campaign Finance & Political Action Committees (PACs)</h2>
              <FinanceChart
                campaigns={finance}
                currentChamber={politician.chamber}
                termsHistory={politician.terms_history}
                politicianName={`${politician.first_name} ${politician.last_name}`}
              />
            </section>
          )}

          {/* Committee Affiliations */}
          {politician.affiliations && politician.affiliations.length > 0 && (
            <section className={styles.section}>
              <h2>Committee & Group Affiliations</h2>
              <AffiliationsList items={politician.affiliations} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
