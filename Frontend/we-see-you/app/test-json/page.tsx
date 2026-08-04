"use client";

import { useState, useEffect } from "react";
import styles from "./test-json.module.scss";
import { fetchPoliticianById, fetchPoliticianFinance, fetchPoliticianLegislation } from "../../lib/api";

interface TestCandidate {
  id: string;
  name: string;
  category: "High-Profile" | "Standard / Regional";
  office: string;
  state: string;
}

const TEST_POLITICIANS: TestCandidate[] = [
  { id: "O000172", name: "Alexandria Ocasio-Cortez", category: "High-Profile", office: "House (NY-14)", state: "NY" },
  { id: "S000148", name: "Chuck Schumer", category: "High-Profile", office: "Senate (NY)", state: "NY" },
  { id: "A000360", name: "Mark Amodei", category: "Standard / Regional", office: "House (NV-2)", state: "NV" },
  { id: "V000136", name: "Gabe Vasquez", category: "Standard / Regional", office: "House (NM-2)", state: "NM" },
];

export default function TestJsonPage() {
  const [selectedPol, setSelectedPol] = useState<TestCandidate>(TEST_POLITICIANS[0]);
  const [activeTab, setActiveTab] = useState<"profile" | "finance" | "legislation">("profile");
  
  const [profileData, setProfileData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [legislationData, setLegislationData] = useState<any>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [prof, fin, leg] = await Promise.allSettled([
          fetchPoliticianById(selectedPol.id),
          fetchPoliticianFinance(selectedPol.id),
          fetchPoliticianLegislation(selectedPol.id),
        ]);

        setProfileData(prof.status === "fulfilled" ? prof.value : { error: prof.reason?.message || "Failed to load profile" });
        setFinanceData(fin.status === "fulfilled" ? fin.value : { error: fin.reason?.message || "Failed to load finance data" });
        setLegislationData(leg.status === "fulfilled" ? leg.value : { error: leg.reason?.message || "Failed to load legislation data" });
      } catch (err: any) {
        setError(err.message || "Failed to fetch data from API");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedPol]);

  const getCurrentJson = () => {
    if (activeTab === "profile") return profileData;
    if (activeTab === "finance") return financeData;
    if (activeTab === "legislation") return legislationData;
    return null;
  };

  const handleCopy = () => {
    const data = getCurrentJson();
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>API Raw Data Inspector</h1>
        <p>
          Compare raw JSON payload output between high-profile and regional politicians to verify data schema consistency.
        </p>
      </header>

      <div className={styles.selectorBar}>
        {TEST_POLITICIANS.map((pol) => (
          <button
            key={pol.id}
            onClick={() => setSelectedPol(pol)}
            className={`${styles.politicianBtn} ${selectedPol.id === pol.id ? styles.active : ""}`}
          >
            {pol.name} ({pol.office}) — <span style={{ opacity: 0.85, fontSize: "0.8em" }}>{pol.category}</span>
          </button>
        ))}
      </div>

      <div className={styles.tabBar}>
        <button
          onClick={() => setActiveTab("profile")}
          className={`${styles.tabBtn} ${activeTab === "profile" ? styles.activeTab : ""}`}
        >
          Profile JSON (/api/politicians/{selectedPol.id})
        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`${styles.tabBtn} ${activeTab === "finance" ? styles.activeTab : ""}`}
        >
          Finance JSON (/api/politicians/{selectedPol.id}/finance)
        </button>
        <button
          onClick={() => setActiveTab("legislation")}
          className={`${styles.tabBtn} ${activeTab === "legislation" ? styles.activeTab : ""}`}
        >
          Legislation JSON (/api/politicians/{selectedPol.id}/legislation)
        </button>
      </div>

      <div className={styles.jsonContainer}>
        <button onClick={handleCopy} className={styles.copyBtn}>
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        {loading ? (
          <div className={styles.statusMessage}>Loading live JSON payload from API backend...</div>
        ) : error ? (
          <div className={styles.statusMessage} style={{ color: "#ef4444" }}>
            {error} (Ensure backend server is running on port 8000)
          </div>
        ) : (
          <pre>{JSON.stringify(getCurrentJson(), null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
