import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { fetchCandidateById } from "../../../lib/api";
import FinanceChart from "../../components/FinanceChart/FinanceChart";
import PacBreakdown from "../../components/PacBreakdown/PacBreakdown";
import styles from "./candidate_profile.module.scss";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateProfilePage({ params }: PageProps) {
  const { id } = await params;

  let candidate;
  let errorMsg = null;

  try {
    candidate = await fetchCandidateById(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve candidate record.";
  }

  if (errorMsg || !candidate) {
    return (
      <div className={styles.statusContainer}>
        <h2>Candidate Profile Not Found</h2>
        <p>{errorMsg || "The candidate profile you are looking for does not exist in our FEC records."}</p>
        <Link href="/local" className={styles.backLink}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Local & District Elections
        </Link>
      </div>
    );
  }

  const partyLower = candidate.party.toLowerCase();
  let partyClass = styles.other;
  if (partyLower.includes("republican")) partyClass = styles.republican;
  else if (partyLower.includes("democrat")) partyClass = styles.democrat;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const financeMap = candidate.finance ? { ["2026 Election Campaign"]: candidate.finance } : null;

  return (
    <div className={styles.container}>
      <Link href="/local" className={styles.backLink}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Local & District Elections
      </Link>

      {/* Candidate Hero Header */}
      <header className={styles.headerCard}>
        <div className={styles.topMeta}>
          <span className={`${styles.partyBadge} ${partyClass}`}>{candidate.party}</span>
          {candidate.is_incumbent && <span className={styles.partyBadge}>Incumbent Candidate</span>}
          {candidate.election_year && <span className={styles.partyBadge}>{candidate.election_year} Election</span>}
        </div>

        <h1 className={styles.name}>{candidate.name}</h1>
        <div className={styles.officeText}>
          Running for {candidate.office} &bull; {candidate.state} {candidate.district ? `(District ${candidate.district})` : ""}
        </div>

        <div className={styles.actionBtns}>
          {candidate.website_url && (
            <a href={candidate.website_url} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.primary}`}>
              Campaign Website &rarr;
            </a>
          )}
          {candidate.contact_email && (
            <a href={`mailto:${candidate.contact_email}`} className={`${styles.btn} ${styles.secondary}`}>
              Contact Campaign ✉
            </a>
          )}
        </div>

        {candidate.fec_id && <div className={styles.fecTag}>Official FEC Candidate ID: {candidate.fec_id}</div>}
      </header>

      {/* Financial Metrics Cards */}
      {candidate.finance && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Campaign Raised</span>
            <span className={`${styles.metricValue} ${styles.green}`}>{formatCurrency(candidate.finance.total_donations)}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Spent</span>
            <span className={`${styles.metricValue} ${styles.blue}`}>{formatCurrency(candidate.total_spent)}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Cash on Hand</span>
            <span className={`${styles.metricValue} ${styles.purple}`}>{formatCurrency(candidate.cash_on_hand)}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Small Donors (&lt;$200)</span>
            <span className={styles.metricValue}>{candidate.finance.small_donations_pct}%</span>
          </div>
        </div>
      )}

      {/* Background Summary */}
      {candidate.bio_summary && (
        <section className={styles.section}>
          <h2>Candidate Background & Platform Overview</h2>
          <p className={styles.helperText}>{candidate.bio_summary}</p>
        </section>
      )}

      {/* Key Policy Positions & Platform Stances */}
      {candidate.policy_stances && candidate.policy_stances.length > 0 && (
        <section className={styles.section}>
          <h2>Key Policy Positions & Campaign Priorities</h2>
          <p className={styles.helperText}>Official candidate stances and platform policy priorities for {candidate.name}:</p>

          <div className={styles.stancesGrid}>
            {candidate.policy_stances.map((stance, idx) => (
              <div key={idx} className={styles.stanceCard}>
                <span className={styles.categoryTag}>{stance.category}</span>
                <span className={styles.positionTitle}>{stance.position}</span>
                <p className={styles.stanceDetails}>{stance.details}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Endorsements */}
      {candidate.endorsements && candidate.endorsements.length > 0 && (
        <section className={styles.section}>
          <h2>Official Campaign Endorsements</h2>
          <p className={styles.helperText}>Organizations, labor unions, and advocacy groups endorsing {candidate.name}:</p>
          <div className={styles.endorsementsList}>
            {candidate.endorsements.map((end, idx) => (
              <span key={idx} className={styles.endorsementBadge}>
                ✓ {end}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* D3 Campaign Finance & Top Donors Chart */}
      {financeMap && (
        <section className={styles.section}>
          <h2>Campaign Finance History & Top Contributing Sectors</h2>
          <p className={styles.helperText}>
            Official election cycle receipts, small donor percentages (&lt;$200), PAC contributions, and top employer sectors direct from the Federal Election Commission (FEC).
          </p>
          <FinanceChart campaigns={financeMap} />

          {candidate.finance && (
            <PacBreakdown pacs={candidate.finance.pacs} superPacs={candidate.finance.super_pacs} />
          )}
        </section>
      )}
    </div>
  );
}
