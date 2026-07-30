import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { fetchPoliticianLegislation } from "../../../../lib/api";
import styles from "./legislation.module.scss";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegislationPage({ params }: PageProps) {
  const { id } = await params;

  let data;
  let errorMsg = null;

  try {
    data = await fetchPoliticianLegislation(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve legislation records.";
  }

  if (errorMsg || !data) {
    return (
      <div className={styles.statusContainer}>
        <h2>Error Loading Records</h2>
        <p>{errorMsg || "The legislation records for this politician could not be found."}</p>
        <Link href={`/profile/${id}`} className={styles.backLink}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/profile/${id}`} className={styles.backLink}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to {data.politician_name}&apos;s Profile
      </Link>

      <header className={styles.header}>
        <h1>Legislation & Voting History</h1>
        <p className={styles.subtitle}>Official sponsored bills and voting record for <strong>{data.politician_name}</strong></p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Sponsored Legislation */}
        <section className={styles.card}>
          <h2>Sponsored Bills ({data.sponsored.length})</h2>
          <p className={styles.helperText}>Recent bills introduced or sponsored by this legislator on Congress.gov.</p>
          
          {data.sponsored.length > 0 ? (
            <ul className={styles.list}>
              {data.sponsored.map((bill, index) => (
                <li key={index} className={styles.listItem}>
                  <div className={styles.billHeader}>
                    <a href={bill.congress_url} target="_blank" rel="noopener noreferrer" className={styles.billNumberLink}>
                      {bill.bill_number}
                    </a>
                    <span className={styles.introducedDate}>Introduced: {bill.introduced_date}</span>
                  </div>
                  <h3 className={styles.billTitle}>{bill.title}</h3>
                  <div className={styles.billStatus}>
                    <span className={styles.statusLabel}>Latest Action:</span> {bill.latest_action}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyMsg}>No sponsored bills found in the official database.</p>
          )}
        </section>

        {/* Right Column: Co-sponsored & Supported Legislation */}
        <section className={styles.card}>
          <h2>Co-Sponsored & Supported Bills ({data.voted.length})</h2>
          <p className={styles.helperText}>Official co-sponsored bills backed and introduced with this legislator from Congress.gov.</p>
          
          {data.voted.length > 0 ? (
            <ul className={styles.list}>
              {data.voted.map((vote, index) => {
                const badgeClass = `${styles.badge} ${styles.yea}`;
                return (
                  <li key={index} className={styles.listItem}>
                    <div className={styles.voteHeader}>
                      {'congress_url' in vote && vote.congress_url ? (
                        <a href={vote.congress_url as string} target="_blank" rel="noopener noreferrer" className={styles.billNumberLink}>
                          {vote.bill_number}
                        </a>
                      ) : (
                        <span className={styles.billNumber}>{vote.bill_number}</span>
                      )}
                      <span className={badgeClass}>{vote.vote_position}</span>
                    </div>
                    <h3 className={styles.billTitle}>{vote.title}</h3>
                    <p className={styles.voteDescription}>{vote.description}</p>
                    <div className={styles.voteFooter}>
                      <span>Date: <strong>{vote.vote_date}</strong></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyMsg}>No recent co-sponsored bill records available.</p>
          )}
        </section>
      </div>
    </div>
  );
}
