"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FinanceSummary } from "../../../lib/api";
import styles from "./FinanceChart.module.scss";

interface FinanceChartProps {
  campaigns: Record<string, FinanceSummary>;
}

interface FormattedDataItem {
  cycle: string;
  small_donations: number;
  pac_donations: number;
  super_pac_donations: number;
}

export default function FinanceChart({ campaigns }: FinanceChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDonorsExpanded, setIsDonorsExpanded] = useState(false);
  const [expandedDonors, setExpandedDonors] = useState<Set<number>>(new Set());

  // Sort keys of campaigns in reverse chronological order (newest campaign first)
  const keys = Object.keys(campaigns).sort((a, b) => {
    const yearA = parseInt(a.match(/\b\d{4}\b/)?.[0] || "0");
    const yearB = parseInt(b.match(/\b\d{4}\b/)?.[0] || "0");
    return yearB - yearA;
  });

  const [selectedCampaignKey, setSelectedCampaignKey] = useState<string>(keys[0] || "");
  const [prevSelectedCampaignKey, setPrevSelectedCampaignKey] = useState<string>(keys[0] || "");

  // Reset expanded states when selected campaign changes (during render to avoid useEffect warning)
  if (selectedCampaignKey !== prevSelectedCampaignKey) {
    setPrevSelectedCampaignKey(selectedCampaignKey);
    setExpandedDonors(new Set());
    setIsDonorsExpanded(false);
  }

  // Safe fallback if selectedCampaignKey is not in campaigns
  const activeKey = campaigns[selectedCampaignKey] ? selectedCampaignKey : keys[0] || "";
  const data = campaigns[activeKey];

  // Helper to format currency values
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const toggleDonorExpand = (index: number) => {
    setExpandedDonors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!svgRef.current || !data || !data.history || data.history.length === 0) return;

    // Clear previous SVG contents
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 75 };

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const history = data.history;

    // Keys to stack
    const stackKeys: (keyof FormattedDataItem)[] = [
      "small_donations",
      "pac_donations",
      "super_pac_donations",
    ];

    // Transpose data for D3 stack (ensure numeric values)
    const formattedData = history.map((d) => ({
      cycle: d.cycle,
      small_donations: Number(d.small_donations),
      pac_donations: Number(d.pac_donations),
      super_pac_donations: Number(d.super_pac_donations),
    }));

    // Generate stacks
    const stack = d3.stack<FormattedDataItem>().keys(stackKeys);
    const series = stack(formattedData);

    // X Scale: Election cycles (Years)
    const x = d3
      .scaleBand()
      .domain(formattedData.map((d) => d.cycle))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    // Y Scale: Combined donation amounts
    const maxY = d3.max(series, (s) => d3.max(s, (d) => d[1])) || 1000000;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.05]) // Add 5% headroom
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Color Scale
    const colors = d3
      .scaleOrdinal<string>()
      .domain(stackKeys as string[])
      .range(["#10b981", "#3b82f6", "#8b5cf6"]); // Green, Blue, Purple

    // Add Gridlines
    svg
      .append("g")
      .attr("class", styles.gridlines)
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat(() => "")
      );

    // Render Bars
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => colors(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d: d3.SeriesPoint<FormattedDataItem>) => x(d.data.cycle)!)
      .attr("y", (d: d3.SeriesPoint<FormattedDataItem>) => y(d[1]))
      .attr("height", (d: d3.SeriesPoint<FormattedDataItem>) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("rx", 3) // rounded corners
      .append("title") // Hover tooltip
      .text((d: d3.SeriesPoint<FormattedDataItem>) => {
        const cycle = d.data.cycle;
        const total = d.data.small_donations + d.data.pac_donations + d.data.super_pac_donations;
        return `Cycle: ${cycle}\nTotal Raised: ${formatCurrency(total)}`;
      });

    // Render X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("class", styles.axis)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Render Y Axis (formatted as currency SI, e.g., $1.5M, $500k)
    const yAxisFormatter = (val: number | d3.NumberValue) => {
      return d3.format("$.2s")(val).replace(/G/, "B"); // Format billions and millions
    };

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", styles.axis)
      .call(d3.axisLeft(y).ticks(5).tickFormat(yAxisFormatter).tickSizeOuter(0));
  }, [data]);

  if (!data) {
    return <p>No campaign finance records available.</p>;
  }

  // Collapsible list variables for donor industries
  const limit = 10;
  const hasMoreDonors = (data.donors?.length || 0) > limit;
  const displayedDonors = isDonorsExpanded ? (data.donors || []) : (data.donors || []).slice(0, limit);

  return (
    <div className={styles.financeWrapper}>
      {keys.length > 1 && (
        <div className={styles.selectorContainer}>
          <label htmlFor="campaign-select">Select Campaign / Office Run</label>
          <select
            id="campaign-select"
            className={styles.campaignSelector}
            value={activeKey}
            onChange={(e) => setSelectedCampaignKey(e.target.value)}
          >
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.financeContainer}>
        <div className={styles.chartWrapper}>
          <svg ref={svgRef}></svg>
        </div>

        <div className={styles.statsPanel}>
          <h3>Donation Breakdown</h3>
          <p className={styles.totalRaised}>
            Total Campaign Raised: <strong>{formatCurrency(data.total_donations)}</strong>
          </p>

          <div className={styles.statList}>
            <div className={styles.statItem}>
              <span className={`${styles.colorIndicator} ${styles.bgSmall}`}></span>
              <span className={styles.categoryLabel}>Small Donations (&lt; $200)</span>
              <span className={styles.categoryPct}>{data.small_donations_pct}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.colorIndicator} ${styles.bgPac}`}></span>
              <span className={styles.categoryLabel}>PAC Contributions</span>
              <span className={styles.categoryPct}>{data.pac_donations_pct}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.colorIndicator} ${styles.bgSuperPac}`}></span>
              <span className={styles.categoryLabel}>Super PAC Funding</span>
              <span className={styles.categoryPct}>{data.super_pac_donations_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {data.donors && data.donors.length > 0 && (
        <div className={styles.donorsSection}>
          <h4>Top Contributing Sectors & Industries</h4>
          <p className={styles.helperText}>Click an industry to expand top contributors.</p>
          <div className={styles.donorsList}>
            {displayedDonors.map((donor, index) => {
              const isExpanded = expandedDonors.has(index);
              return (
                <div key={index} className={styles.donorGroup}>
                  <div
                    className={`${styles.donorRow} ${isExpanded ? styles.activeRow : ""}`}
                    onClick={() => toggleDonorExpand(index)}
                  >
                    <span className={styles.donorName}>
                      <span className={styles.arrow}>{isExpanded ? "▼" : "▶"}</span>
                      {donor.name}
                    </span>
                    <span className={styles.donorAmount}>{formatCurrency(donor.amount)}</span>
                  </div>

                  {isExpanded && donor.contributors && donor.contributors.length > 0 && (
                    <div className={styles.contributorsList}>
                      {donor.contributors.map((contrib, cIndex) => (
                        <div key={cIndex} className={styles.contribRow}>
                          <span className={styles.contribName}>{contrib.name}</span>
                          <span className={styles.contribAmount}>{formatCurrency(contrib.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hasMoreDonors && (
            <button
              onClick={() => setIsDonorsExpanded(!isDonorsExpanded)}
              className={styles.toggleBtn}
            >
              {isDonorsExpanded ? "Show Less" : `Show More (${(data.donors?.length || 0) - limit} more)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
