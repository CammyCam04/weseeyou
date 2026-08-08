"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import styles from "./profile-template.module.scss";
import { PoliticianDetail, FinanceSummary, SponsoredLegislationItem } from "@/lib/api";
import Avatar from "../avatar/avatar";
import FinanceChart from "../finance-chart/finance-chart";
import PacBreakdown from "../pac-breakdown/pac-breakdown";
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
  const firstCampaignKey = finance ? Object.keys(finance)[0] : null;
  const firstCampaign = firstCampaignKey && finance ? finance[firstCampaignKey] : null;

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
              <span className={styles.label}>Chamber:</span>
              <span className={styles.value}>{politician.chamber}</span>
            </div>
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

          {/* Campaign Finance Breakdown & Circle Graph */}
          {finance && (
            <section className={styles.section}>
              <h2>Campaign Finance & Political Action Committees (PACs)</h2>
              <FinanceChart campaigns={finance} />
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
