import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { fetchJudgeById } from "../../../lib/api";
import Avatar from "../../components/Avatar/Avatar";
import styles from "./judge_profile.module.scss";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JudgeProfilePage({ params }: PageProps) {
  const { id } = await params;

  let judge;
  let errorMsg = null;

  try {
    judge = await fetchJudgeById(id);
  } catch (err: unknown) {
    console.error(err);
    errorMsg = err instanceof Error ? err.message : "Could not retrieve judicial record.";
  }

  if (errorMsg || !judge) {
    return (
      <div className={styles.statusContainer}>
        <h2>Judicial Profile Not Found</h2>
        <p>{errorMsg || "The judge or justice you are looking for does not exist in our federal records."}</p>
        <Link href="/judiciary" className={styles.backLink}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Judiciary Roster
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/judiciary" className={styles.backLink}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back to Judiciary Roster
      </Link>

      {/* Header Card */}
      <header className={styles.headerCard}>
        <div className={styles.topRow}>
          <span className={styles.courtBadge}>{judge.court_name}</span>
          <span className={styles.tenureBadge}>{judge.tenure_type} &bull; State: {judge.state}</span>
        </div>

        <div className={styles.mainInfo}>
          <Avatar
            src={judge.profile_image_url}
            firstName={judge.first_name}
            lastName={judge.last_name}
            size="large"
          />
          <div>
            <h1 className={styles.judgeTitle}>
              {judge.first_name} {judge.last_name}
            </h1>
            <p className={styles.courtSub}>{judge.title}</p>
          </div>
        </div>
      </header>

      {/* Biography & Jurisprudence Card */}
      {judge.bio_summary && (
        <section className={styles.section}>
          <h2>Judicial Biography & Background</h2>
          <p style={{ lineHeight: 1.6, color: "var(--foreground-muted)" }}>
            {judge.bio_summary}
          </p>
        </section>
      )}

      {/* Key Opinions & Precedents Card */}
      <section className={styles.section}>
        <h2>Key Opinions, Landmark Rulings & Jurisprudence</h2>
        {judge.opinions && judge.opinions.length > 0 ? (
          judge.opinions.map((op, idx) => (
            <div key={idx} className={styles.opinionCard}>
              <div className={styles.opinionHeader}>
                <span className={styles.caseTitle}>{op.case_name}</span>
                {op.topic && <span className={styles.topicBadge}>{op.topic}</span>}
              </div>
              <p className={styles.opinionSummary}>{op.summary}</p>
            </div>
          ))
        ) : (
          <p style={{ color: "var(--foreground-muted)" }}>
            No recorded landmark opinions for this judicial official in the current dataset.
          </p>
        )}
      </section>
    </div>
  );
}
