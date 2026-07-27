import styles from "./about.module.scss";

export default function AboutPage() {
  const billTypes = [
    {
      code: "H.R.",
      name: "House Bill",
      desc: "Proposed binding federal law originating in the House of Representatives. If passed by both chambers and signed by the President, it becomes a binding federal statute.",
    },
    {
      code: "S.",
      name: "Senate Bill",
      desc: "Proposed binding federal law originating in the Senate. Has the same legal standing as an H.R. bill once enacted.",
    },
    {
      code: "H.CON.RES / HCONRES",
      name: "House Concurrent Resolution",
      desc: "A non-binding resolution agreed to by both the House and Senate. Used for budget frameworks, joint administrative rules, or expressing the official opinion of Congress. Does not require presidential signature.",
    },
    {
      code: "S.CON.RES / SCONRES",
      name: "Senate Concurrent Resolution",
      desc: "Same as H.CON.RES, originating in the Senate.",
    },
    {
      code: "H.J.RES / HJRES",
      name: "House Joint Resolution",
      desc: "Carries the force of law if passed and signed by the President. Also used to propose Constitutional Amendments (which require a 2/3 vote in both chambers and state ratification, but no presidential signature).",
    },
    {
      code: "S.J.RES / SJRES",
      name: "Senate Joint Resolution",
      desc: "Same as H.J.RES, originating in the Senate.",
    },
    {
      code: "H.RES / HRES",
      name: "House Simple Resolution",
      desc: "Concerns matters exclusively within the House (e.g. committee assignments, procedural rules, or honoring individuals). Does not go to the Senate or President.",
    },
    {
      code: "S.RES / SRES",
      name: "Senate Simple Resolution",
      desc: "Internal Senate resolution regarding Senate rules, committee structures, or advice and consent procedures.",
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          About <span>We See You</span> & Legislative Guide
        </h1>
        <p>
          An open political transparency platform providing real-time data on U.S. politicians, Congressional committees, campaign finance records, and legislation.
        </p>
      </header>

      {/* Bill Guide Section */}
      <section id="bill-guide" className={styles.card}>
        <h2>📖 Legislative Bill Types Guide</h2>
        <p>
          In Congress, legislation is designated with abbreviations based on where it originated and what type of measure it is. Use this reference guide to understand bill prefixes:
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bill Prefix</th>
                <th>Full Designation</th>
                <th>Explanation & Legal Weight</th>
              </tr>
            </thead>
            <tbody>
              {billTypes.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={styles.codeBadge}>{item.code}</span>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Campaign Finance Glossary */}
      <section className={styles.card}>
        <h2>💰 Campaign Finance Breakdown</h2>
        <p>
          Campaign finance charts track where politicians receive funding for their election cycles based on official Federal Election Commission (FEC) disclosures:
        </p>
        <div className={styles.dataList}>
          <div className={styles.dataItem}>
            <h3>Small Individual Donations (&lt; $200)</h3>
            <p>Direct contributions from individual citizens under $200 that do not require detailed itemization. Often indicates grassroots support.</p>
          </div>
          <div className={styles.dataItem}>
            <h3>PAC Contributions</h3>
            <p>Direct donations from Political Action Committees representing corporations, labor unions, or advocacy groups, capped by federal limits.</p>
          </div>
          <div className={styles.dataItem}>
            <h3>Super PAC & Independent Expenditure</h3>
            <p>Independent political committees that can raise unlimited funds to advocate for or against candidates, but cannot contribute directly to candidates.</p>
          </div>
        </div>
      </section>

      {/* Official Data Sources */}
      <section className={styles.card}>
        <h2>🌐 Official Data Sources</h2>
        <p>
          All data rendered on this platform is pulled directly from verified U.S. government databases and APIs:
        </p>
        <div className={styles.dataList}>
          <div className={styles.dataItem}>
            <h3>U.S. Congress Dataset</h3>
            <p>Provides official legislator rosters, committee memberships, terms, and social media accounts.</p>
          </div>
          <div className={styles.dataItem}>
            <h3>Federal Election Commission (FEC)</h3>
            <p>Official candidate financial totals, receipts, election cycle histories, and donor employer sectors.</p>
          </div>
          <div className={styles.dataItem}>
            <h3>Congress.gov API</h3>
            <p>Official sponsored and co-sponsored bills, legislative actions, committee referrals, and roll-call statuses.</p>
          </div>
          <div className={styles.dataItem}>
            <h3>Wikipedia REST API</h3>
            <p>Verified neutral biographical summaries and career focus overviews for members of Congress.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
