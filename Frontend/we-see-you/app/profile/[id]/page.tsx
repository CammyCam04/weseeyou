import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import styles from "./profile.module.scss";
import { fetchPoliticianById, fetchPoliticianFinance } from "../../../lib/api";
import FinanceChart from "../../components/FinanceChart/FinanceChart";
import PacBreakdown from "../../components/PacBreakdown/PacBreakdown";
import AffiliationsList from "../../components/AffiliationsList/AffiliationsList";
import Avatar from "../../components/Avatar/Avatar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  // Await the dynamic params promise in Next.js 16
  const { id } = await params;

  let politician;
  let finance = null;
  let errorMsg = null;

  try {
    politician = await fetchPoliticianById(id);
    finance = await fetchPoliticianFinance(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve politician profile.";
  }

  // Handle errors or not found states
  if (errorMsg || !politician) {
    return (
      <div className={styles.statusContainer}>
        <h2>Profile Not Found</h2>
        <p>{errorMsg || "The politician you are looking for does not exist in our records."}</p>
        <Link href="/" className={styles.backLink}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Search
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

  const getAge = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const firstCampaignKey = finance ? Object.keys(finance)[0] : null;
  const firstCampaign = firstCampaignKey && finance ? finance[firstCampaignKey] : null;

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Search
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

          <span className={partyClasses[politician.party] || partyClasses.I}>
            {partyLabels[politician.party] || partyLabels.I}
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
            <div className={styles.infoItem}>
              <span className={styles.label}>Born:</span>
              <span className={styles.value}>
                {politician.date_of_birth} ({getAge(politician.date_of_birth)} years old)
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Gender:</span>
              <span className={styles.value}>{politician.gender === "M" ? "Male" : "Female"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Next Election:</span>
              <span className={styles.value}>{politician.next_election || "N/A"}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Social Links */}
          <div className={styles.socialGrid}>
            {politician.website_url && (
              <a
                href={politician.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                Website
              </a>
            )}
            {politician.twitter_account && (
              <a
                href={`https://twitter.com/${politician.twitter_account}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                Twitter
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

        {/* Right Column: Key Details */}
        <main className={styles.mainContent}>
          {/* Biography & Key Overview Card */}
          {politician.bio_summary && (
            <section className={styles.section}>
              <h2>Biography & Career Overview</h2>
              <p style={{ lineHeight: 1.6, color: "var(--foreground-muted, #cbd5e1)", fontSize: "0.95rem" }}>
                {politician.bio_summary}
              </p>
            </section>
          )}

          {/* Recently Sponsored Legislation Card */}
          <section className={styles.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <h2 style={{ margin: 0 }}>Recently Sponsored Legislation</h2>
              <Link href="/about#bill-guide" style={{ fontSize: "0.85rem", color: "#38bdf8", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <HugeiconsIcon icon={InformationCircleIcon} size={16} /> Bill Types Guide
              </Link>
            </div>
            {politician.sponsored_legislation && politician.sponsored_legislation.length > 0 ? (
              <>
                <ul className={styles.list}>
                  {politician.sponsored_legislation.map((bill, index) => (
                    <li key={index} className={styles.listItem}>
                      <span className={styles.bullet}>&bull;</span>
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
                <div className={styles.viewMoreContainer}>
                  <Link href={`/profile/${id}/legislation`} className={styles.viewMoreBtn}>
                    View All Sponsored & Voted Legislation <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Link>
                </div>
              </>
            ) : (
              <p>No recently sponsored legislation recorded for this politician yet.</p>
            )}
          </section>

          {/* Campaign Finance D3 Card & Itemized PACs */}
          {finance && (
            <section className={styles.section}>
              <h2>Campaign Finance History & PAC Groups</h2>
              <FinanceChart campaigns={finance} />
              {firstCampaign && (
                <PacBreakdown pacs={firstCampaign.pacs} superPacs={firstCampaign.super_pacs} />
              )}
            </section>
          )}

          {/* Affiliations Card */}
          <section className={styles.section}>
            <h2>Committee & Group Affiliations</h2>
            <AffiliationsList items={politician.affiliations} />
          </section>
        </main>
      </div>
    </div>
  );
}

