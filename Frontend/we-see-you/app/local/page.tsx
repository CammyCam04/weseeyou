"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./local.module.scss";
import { fetchLocalElections, LocalLookupResponse } from "../../lib/api";
import Avatar from "../components/Avatar/Avatar";

const US_STATES = [
  { code: "", name: "-- Select State --" },
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

function LocalElectionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlState = searchParams.get("state") || "";
  const urlDistrict = searchParams.get("district") || "";
  const urlAddress = searchParams.get("address") || "";

  const [selectedState, setSelectedState] = useState<string>(urlState);
  const [district, setDistrict] = useState<string>(urlDistrict);
  const [address, setAddress] = useState<string>(urlAddress);

  const [data, setData] = useState<LocalLookupResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL params on mount/navigation
  useEffect(() => {
    setSelectedState(urlState);
    setDistrict(urlDistrict);
    setAddress(urlAddress);
  }, [urlState, urlDistrict, urlAddress]);

  const loadData = useCallback(async (st: string, dist: string, addr: string) => {
    if (!st) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchLocalElections(st, dist || undefined, addr || undefined);
      setData(res);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to load local elections data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlState) {
      loadData(urlState, urlDistrict, urlAddress);
    } else {
      setData(null);
      setLoading(false);
    }
  }, [urlState, urlDistrict, urlAddress, loadData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState) {
      setError("Please select a State to search.");
      return;
    }

    const params = new URLSearchParams();
    params.set("state", selectedState);
    if (district) params.set("district", district);
    if (address) params.set("address", address);

    router.push(`/local?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          Local & State <span>Elections Explorer</span>
        </h1>
        <p>
          Select your State or enter your District / ZIP to explore active running candidates, current incumbents, and township officials.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.searchPanel}>
        <div className={styles.inputGroup}>
          <label htmlFor="state-select">Select State</label>
          <select
            id="state-select"
            className={styles.select}
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} {s.code && `(${s.code})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="district-input">District (Optional)</label>
          <input
            id="district-input"
            type="text"
            placeholder="e.g. 22 or 14"
            className={styles.input}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="address-input">ZIP / City / Township (Optional)</label>
          <input
            id="address-input"
            type="text"
            placeholder="e.g. 78701 or Austin"
            className={styles.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.searchBtn}>
          Search Local Elections
        </button>
      </form>

      {!urlState && !loading && (
        <div className={styles.status} style={{ padding: "4rem 1rem", background: "rgba(30, 41, 59, 0.4)", borderRadius: "16px", border: "1px border rgba(255,255,255,0.08)" }}>
          <h2 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>🔎 Ready to Search</h2>
          <p>Please select a <strong>State</strong> above and click <strong>Search Local Elections</strong> to explore candidates and officials.</p>
        </div>
      )}

      {loading && <div className={styles.status}>Loading active candidates & incumbents for {selectedState}...</div>}
      {error && <div className={styles.status}>{error}</div>}

      {!loading && data && (
        <>
          {/* Active Running Candidates Section */}
          <section className={styles.section}>
            <h2>
              Active Running Candidates in {data.state} {data.district ? `(District ${data.district})` : ""} ({data.running_candidates.length})
            </h2>
            <p className={styles.helperText}>
              Candidates actively registered and running for Federal House, Senate, or Executive office with the FEC.
            </p>

            {data.running_candidates.length > 0 ? (
              <div className={styles.candidatesGrid}>
                {data.running_candidates.map((cand) => {
                  const partyLower = cand.party.toLowerCase();
                  let pClass = styles.other;
                  if (partyLower.includes("republican")) pClass = styles.republican;
                  else if (partyLower.includes("democrat")) pClass = styles.democrat;
                  else if (partyLower.includes("libertarian")) pClass = styles.libertarian;

                  return (
                    <Link key={cand.id} href={`/candidate/${cand.id}`} className={styles.candidateCard} style={{ textDecoration: "none" }}>
                      <div className={styles.candHeader}>
                        <span className={styles.candName}>{cand.name}</span>
                        <span className={`${styles.partyBadge} ${pClass}`}>{cand.party}</span>
                      </div>
                      <div className={styles.candOffice}>{cand.office}</div>
                      <div className={styles.candMeta}>
                        {cand.district ? `Congressional District ${cand.district}` : `Statewide (${cand.state})`}
                        {cand.is_incumbent && " • Incumbent"}
                      </div>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                        View Candidate Profile & FEC Finances &rarr;
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.helperText}>No running candidates currently returned for this filter.</p>
            )}
          </section>

          {/* Township & Municipal Candidates Section */}
          {data.township_candidates && data.township_candidates.length > 0 && (
            <section className={styles.section}>
              <h2>
                Candidates Running for Township & Municipal Offices ({data.township_candidates.length})
              </h2>
              <p className={styles.helperText}>
                Active candidates running for local Mayor, City Treasurer, Township Clerk, County Sheriff, and City Council. Click any candidate to view their platform stances and municipal campaign budget.
              </p>

              <div className={styles.candidatesGrid}>
                {data.township_candidates.map((cand) => (
                  <Link key={cand.id} href={`/candidate/${cand.id}`} className={styles.candidateCard} style={{ textDecoration: "none" }}>
                    <div className={styles.candHeader}>
                      <span className={styles.candName}>{cand.name}</span>
                      <span className={`${styles.partyBadge} ${styles.other}`}>{cand.party}</span>
                    </div>
                    <div className={styles.candOffice}>{cand.office}</div>
                    <div className={styles.candMeta}>
                      {cand.district} {cand.is_incumbent && " • Incumbent"}
                    </div>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                      View Local Platform & Stances &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Current Incumbents in Office */}
          <section className={styles.section}>
            <h2>
              Elected Representatives in Office for {data.state} ({data.incumbents.length})
            </h2>
            <p className={styles.helperText}>
              Current Senators and Representatives serving in the U.S. Congress for {data.state}. Click to view campaign finance and legislative records.
            </p>

            {data.incumbents.length > 0 ? (
              <div className={styles.incumbentsGrid}>
                {data.incumbents.map((inc) => (
                  <Link key={inc.id} href={`/profile/${inc.id}`} className={styles.incumbentCard}>
                    <Avatar
                      src={inc.profile_image_url}
                      firstName={inc.first_name}
                      lastName={inc.last_name}
                      size="small"
                    />
                    <div className={styles.incInfo}>
                      <span className={styles.name}>
                        {inc.first_name} {inc.last_name}
                      </span>
                      <span className={styles.title}>
                        {inc.title} &bull; {inc.state}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.helperText}>No incumbents found for this selection.</p>
            )}
          </section>

          {/* Local Municipal & Township Leadership Directory */}
          {data.civic_officials && data.civic_officials.length > 0 && (
            <section className={styles.section}>
              <h2>Township & Municipal Leadership ({data.civic_officials.length})</h2>
              <p className={styles.helperText}>Currently serving Mayor, City Treasurer, Township Clerk, County Sheriff, and City Council members. Click any official to view their leadership portfolio.</p>

              <div className={styles.candidatesGrid}>
                {data.civic_officials.map((civ, idx) => {
                  const cardContent = (
                    <div className={styles.candidateCard}>
                      <div className={styles.candHeader}>
                        <span className={styles.candName}>{civ.name}</span>
                        <span className={`${styles.partyBadge} ${styles.other}`}>{civ.level}</span>
                      </div>
                      <span className={styles.candOffice}>{civ.office_title}</span>
                      <span className={styles.candMeta}>
                        {civ.party ? `Party: ${civ.party}` : "Nonpartisan Office"}
                        {civ.phones && civ.phones.length > 0 && ` • ${civ.phones[0]}`}
                      </span>
                      {civ.id && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                          View Official Leadership Profile &rarr;
                        </div>
                      )}
                    </div>
                  );

                  return civ.id ? (
                    <Link key={idx} href={`/candidate/${civ.id}`} style={{ textDecoration: "none" }}>
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={idx}>{cardContent}</div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function LocalPage() {
  return (
    <Suspense fallback={<div className={styles.status}>Loading Local Elections Explorer...</div>}>
      <LocalElectionsContent />
    </Suspense>
  );
}
