import Link from "next/link";
import { fetchCommitteeById } from "../../../lib/api";
import Avatar from "../../components/Avatar/Avatar";
import styles from "./committee_detail.module.scss";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CommitteeDetailPage({ params }: PageProps) {
  const { id } = await params;

  let committee;
  let errorMsg = null;

  try {
    committee = await fetchCommitteeById(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve committee details.";
  }

  if (errorMsg || !committee) {
    return (
      <div className={styles.statusContainer}>
        <h2>Committee Not Found</h2>
        <p>{errorMsg || "The committee you are looking for does not exist."}</p>
        <Link href="/committees" className={styles.backLink}>
          &larr; Back to Committees List
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/committees" className={styles.backLink}>
        &larr; Back to Committees List
      </Link>

      {/* Header Card */}
      <header className={styles.header}>
        <div className={styles.topRow}>
          <span className={`${styles.badge} ${styles[committee.type] || styles.house}`}>
            U.S. {committee.type} Committee
          </span>
          {committee.website_url && (
            <a
              href={committee.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.websiteBtn}
            >
              Official Website &rarr;
            </a>
          )}
        </div>
        <h1 className={styles.title}>{committee.name}</h1>
      </header>

      {/* Committee Members Roster */}
      <section className={styles.section}>
        <h2>Committee Members ({committee.members.length})</h2>
        <p className={styles.helperText}>
          Current members of Congress serving on this committee. Click a member to view their full profile & campaign finance history.
        </p>

        <div className={styles.membersGrid}>
          {committee.members.map((member) => {
            const isChair = member.role.toLowerCase().includes("chair") && !member.role.toLowerCase().includes("vice");
            const isRanking = member.role.toLowerCase().includes("ranking");

            let cardClass = styles.memberCard;
            if (isChair) cardClass = `${styles.memberCard} ${styles.chair}`;
            else if (isRanking) cardClass = `${styles.memberCard} ${styles.ranking}`;

            const partyClass = member.party === "D" ? styles.d : member.party === "R" ? styles.r : styles.i;

            return (
              <Link
                key={member.bioguide_id}
                href={`/profile/${member.bioguide_id}`}
                className={cardClass}
              >
                <Avatar
                  src={member.profile_image_url}
                  firstName={member.first_name}
                  lastName={member.last_name}
                  size="small"
                />
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>
                    {member.first_name} {member.last_name}
                  </span>
                  <span className={styles.memberRole}>{member.role}</span>
                  <span className={styles.memberSub}>
                    {member.title} &bull; {member.state}
                  </span>
                  <span className={`${styles.partyBadge} ${partyClass}`}>
                    {member.party === "D" ? "Democrat" : member.party === "R" ? "Republican" : "Independent"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Subcommittees */}
      {committee.subcommittees && committee.subcommittees.length > 0 && (
        <section className={styles.section}>
          <h2>Subcommittees ({committee.subcommittees.length})</h2>
          <p className={styles.helperText}>Specialized panels under the main committee dealing with targeted legislative areas.</p>
          <div className={styles.subcommitteesList}>
            {committee.subcommittees.map((sub) => (
              <div key={sub.id} className={styles.subItem}>
                &bull; {sub.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Proposed & Reported Bills */}
      <section className={styles.section}>
        <h2>Proposed & Reported Legislation ({committee.bills.length})</h2>
        <p className={styles.helperText}>Official bills referred to or reported out of this committee from Congress.gov.</p>

        {committee.bills && committee.bills.length > 0 ? (
          <div className={styles.billsList}>
            {committee.bills.map((bill, index) => (
              <div key={index} className={styles.billItem}>
                <div className={styles.billHeader}>
                  <a
                    href={bill.congress_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.billLink}
                  >
                    {bill.bill_number}
                  </a>
                  <span className={styles.relBadge}>{bill.relationship_type}</span>
                </div>
                <div className={styles.billMeta}>Action Date: {bill.action_date}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.helperText}>No recent bills returned for this committee yet.</p>
        )}
      </section>
    </div>
  );
}
