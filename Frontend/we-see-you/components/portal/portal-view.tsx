"use client";

import React, { useState, useEffect } from "react";
import styles from "./portal-view.module.scss";
import Header from "../templates/header/header";
import NationalSearch from "../national-search/national-search";
import StateSearch from "../state-search/state-search";
import CountyMunicipalitySearch from "../county-municipality-search/county-municipality-search";
import AboutView from "../about/about-view";
import TestJsonView from "../test-json/test-json-view";
import { ProfileTemplate } from "../templates";
import { fetchPoliticianById, fetchPoliticianFinance, PoliticianDetail, FinanceSummary } from "@/lib/api";

export default function PortalView() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("national");
  const [selectedPoliticianId, setSelectedPoliticianId] = useState<string | null>(null);

  // Profile data state
  const [profileData, setProfileData] = useState<PoliticianDetail | null>(null);
  const [financeData, setFinanceData] = useState<Record<string, FinanceSummary> | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse URL search params on client mount for deep linking (?tab=... or ?id=...)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const idParam = params.get("id") || params.get("politician");

    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (idParam) {
      setSelectedPoliticianId(idParam);
    }
  }, []);

  // Fetch politician details when selectedPoliticianId changes
  useEffect(() => {
    if (!selectedPoliticianId) {
      setProfileData(null);
      setFinanceData(null);
      return;
    }

    async function loadPolitician() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const prof = await fetchPoliticianById(selectedPoliticianId!);
        setProfileData(prof);
        try {
          const fin = await fetchPoliticianFinance(selectedPoliticianId!);
          setFinanceData(fin);
        } catch (finErr) {
          console.warn("Finance fetch warning:", finErr);
          setFinanceData(null);
        }
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Failed to load politician profile.";
        setProfileError(msg);
      } finally {
        setProfileLoading(false);
      }
    }

    loadPolitician();
  }, [selectedPoliticianId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedPoliticianId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      url.searchParams.delete("id");
      url.searchParams.delete("politician");
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleBackToSearch = () => {
    setSelectedPoliticianId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      url.searchParams.delete("politician");
      window.history.pushState({}, "", url.toString());
    }
  };

  if (!mounted) {
    return (
      <div className={styles.portalWrapper}>
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <main className={styles.mainContent}>
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--foreground-secondary)" }}>
            Loading civic transparency portal...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.portalWrapper}>
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className={styles.mainContent}>
        {/* Profile Detail Mode */}
        {selectedPoliticianId ? (
          <div>
            {profileLoading && (
              <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--foreground-secondary)" }}>
                Loading verified legislator profile and FEC campaign finance data...
              </div>
            )}
            {!profileLoading && (
              <ProfileTemplate
                politician={profileData}
                finance={financeData}
                errorMsg={profileError}
                onBack={handleBackToSearch}
                backLabel="Return to Search Roster"
              />
            )}
          </div>
        ) : (
          /* Active Tab View */
          <>
            {activeTab === "national" && <NationalSearch onSelectPolitician={setSelectedPoliticianId} />}
            {activeTab === "state" && <StateSearch />}
            {activeTab === "county-municipality" && <CountyMunicipalitySearch />}
            {activeTab === "about" && <AboutView />}
            {activeTab === "test-json" && <TestJsonView />}
          </>
        )}
      </main>
    </div>
  );
}
