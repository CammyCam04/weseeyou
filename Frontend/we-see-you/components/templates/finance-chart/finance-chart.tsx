"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FinanceSummary, TopDonorItem, PacItem } from "@/lib/api";
import styles from "./finance-chart.module.scss";

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
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const donutSvgRef = useRef<SVGSVGElement | null>(null);

  const [isDonorsExpanded, setIsDonorsExpanded] = useState(false);
  const [expandedDonors, setExpandedDonors] = useState<Set<number>>(new Set());
  const [pacTab, setPacTab] = useState<"all" | "pacs" | "superPacs">("all");

  // Sort campaign cycle keys in reverse chronological order
  const keys = Object.keys(campaigns).sort((a, b) => {
    const yearA = parseInt(a.match(/\b\d{4}\b/)?.[0] || "0");
    const yearB = parseInt(b.match(/\b\d{4}\b/)?.[0] || "0");
    return yearB - yearA;
  });

  const [selectedCampaignKey, setSelectedCampaignKey] = useState<string>(keys[0] || "");

  const handleCampaignChange = (key: string) => {
    setSelectedCampaignKey(key);
    setExpandedDonors(new Set());
    setIsDonorsExpanded(false);
  };

  const activeKey = campaigns[selectedCampaignKey] ? selectedCampaignKey : keys[0] || "";
  const data = campaigns[activeKey];

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

  // 1. Render Donut / Circle Percentage Graph
  useEffect(() => {
    if (!donutSvgRef.current || !data) return;

    d3.select(donutSvgRef.current).selectAll("*").remove();

    const width = 240;
    const height = 240;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.65;

    const svg = d3
      .select(donutSvgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Calculate dollar amounts for categories based on cycle total and percentages
    const total = data.total_donations || 1;
    const smallPct = data.small_donations_pct || 0;
    const pacPct = data.pac_donations_pct || 0;
    const superPacPct = data.super_pac_donations_pct || 0;

    const donutData = [
      {
        name: "Individual & Small (<$200)",
        percentage: smallPct,
        amount: (smallPct / 100) * total,
        color: "#3b82f6",
      },
      {
        name: "Traditional PAC Direct",
        percentage: pacPct,
        amount: (pacPct / 100) * total,
        color: "#10b981",
      },
      {
        name: "Super PAC & Outside Funds",
        percentage: superPacPct,
        amount: (superPacPct / 100) * total,
        color: "#f59e0b",
      },
    ].filter((d) => d.percentage > 0 || d.amount > 0);

    const pie = d3
      .pie<{ name: string; percentage: number; amount: number; color: string }>()
      .value((d) => d.percentage || 0.01)
      .sort(null)
      .padAngle(0.04);

    const arc = d3
      .arc<d3.PieArcDatum<{ name: string; percentage: number; amount: number; color: string }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 6)
      .cornerRadius(4);

    const hoverArc = d3
      .arc<d3.PieArcDatum<{ name: string; percentage: number; amount: number; color: string }>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius)
      .cornerRadius(4);

    const paths = svg
      .selectAll("path")
      .data(pie(donutData))
      .enter()
      .append("path")
      .attr("d", (d) => arc(d) || "")
      .attr("fill", (d) => d.data.color)
      .style("transition", "all 0.2s ease")
      .style("cursor", "pointer");

    paths
      .on("mouseenter", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", () => hoverArc(d) || "")
          .style("opacity", 0.95);
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", () => arc(d) || "")
          .style("opacity", 1);
      });
  }, [data]);

  // 2. Render Stacked Multi-Cycle Bar Chart
  useEffect(() => {
    if (!barSvgRef.current || !data || !data.history || data.history.length === 0) return;

    d3.select(barSvgRef.current).selectAll("*").remove();

    const width = 500;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 40, left: 75 };

    const svg = d3
      .select(barSvgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const history = data.history;
    const stackKeys: (keyof FormattedDataItem)[] = [
      "small_donations",
      "pac_donations",
      "super_pac_donations",
    ];

    const formattedData: FormattedDataItem[] = history.map((d) => ({
      cycle: d.cycle,
      small_donations: Number(d.small_donations) || 0,
      pac_donations: Number(d.pac_donations) || 0,
      super_pac_donations: Number(d.super_pac_donations) || 0,
    }));

    const stack = d3.stack<FormattedDataItem>().keys(stackKeys);
    const series = stack(formattedData);

    const x = d3
      .scaleBand()
      .domain(formattedData.map((d) => d.cycle))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    const yMax = d3.max(series, (layer) => d3.max(layer, (d) => d[1])) || 0;
    const y = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(stackKeys as string[])
      .range(["#3b82f6", "#10b981", "#f59e0b"]);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `$${d3.format(".2s")(d)}`)
      )
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px");

    // Grid lines
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.06)"));

    // Stacks
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.cycle) || 0)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth())
      .attr("rx", 2);
  }, [data]);

  if (!data) return null;

  const topDonors = data.top_donors || [];
  const displayDonors = isDonorsExpanded ? topDonors : topDonors.slice(0, 5);

  const pacs = data.pacs || [];
  const superPacs = data.super_pacs || [];
  const allPacItems = [...pacs, ...superPacs].sort((a, b) => b.amount - a.amount);
  const displayPacItems =
    pacTab === "all" ? allPacItems : pacTab === "pacs" ? pacs : superPacs;
  const maxPacAmount = Math.max(...allPacItems.map((i) => i.amount), 1);

  // Derived dollar values for current cycle
  const totalRaised = data.total_donations || 0;
  const smallDollar = (data.small_donations_pct / 100) * totalRaised;
  const pacDollar = (data.pac_donations_pct / 100) * totalRaised;
  const superPacDollar = (data.super_pac_donations_pct / 100) * totalRaised;

  return (
    <div className={styles.chartWrapper}>
      {/* Campaign Cycle Selector Header */}
      <div className={styles.chartHeader}>
        <h3>Campaign Finance Breakdown (FEC Verified)</h3>
        {keys.length > 1 && (
          <div className={styles.cycleSelector}>
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                className={`${styles.cycleBtn} ${k === activeKey ? styles.active : ""}`}
                onClick={() => handleCampaignChange(k)}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. Circle / Donut Percentage Graph of Current Election Cycle */}
      <div className={styles.overviewGrid}>
        <div className={styles.donutContainer}>
          <svg ref={donutSvgRef} className={styles.donutSvg} />
          <div className={styles.donutCenter}>
            <span className={styles.centerTotal}>{formatCurrency(totalRaised)}</span>
            <span className={styles.centerLabel}>Total Raised</span>
          </div>
        </div>

        <div className={styles.donutMetrics}>
          {/* Individual & Grassroots Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricLeft}>
              <span className={styles.metricDot} style={{ backgroundColor: "#3b82f6" }} />
              <div>
                <span className={styles.metricName}>Individual & Grassroots</span>
                <span className={styles.metricSub}>Direct citizens & unitemized (&lt;$200)</span>
              </div>
            </div>
            <div className={styles.metricRight}>
              <span className={styles.metricValue}>{formatCurrency(smallDollar)}</span>
              <span className={styles.metricPct} style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                {data.small_donations_pct}%
              </span>
            </div>
          </div>

          {/* Traditional PAC Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricLeft}>
              <span className={styles.metricDot} style={{ backgroundColor: "#10b981" }} />
              <div>
                <span className={styles.metricName}>Traditional PAC Direct</span>
                <span className={styles.metricSub}>Corporate, labor & committee PACs</span>
              </div>
            </div>
            <div className={styles.metricRight}>
              <span className={styles.metricValue}>{formatCurrency(pacDollar)}</span>
              <span className={styles.metricPct} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                {data.pac_donations_pct}%
              </span>
            </div>
          </div>

          {/* Super PAC Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricLeft}>
              <span className={styles.metricDot} style={{ backgroundColor: "#f59e0b" }} />
              <div>
                <span className={styles.metricName}>Super PAC & Outside Funds</span>
                <span className={styles.metricSub}>Independent expenditures & action funds</span>
              </div>
            </div>
            <div className={styles.metricRight}>
              <span className={styles.metricValue}>{formatCurrency(superPacDollar)}</span>
              <span className={styles.metricPct} style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                {data.super_pac_donations_pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Synchronized Itemized PAC & Super PAC Breakdown for Active Cycle */}
      {(pacs.length > 0 || superPacs.length > 0) && (
        <div className={styles.pacSection}>
          <div className={styles.pacHeader}>
            <h4>Itemized PAC & Super PAC Contributions ({activeKey})</h4>
            <div className={styles.pacTabs}>
              <button
                type="button"
                className={`${styles.pacTabBtn} ${pacTab === "all" ? styles.active : ""}`}
                onClick={() => setPacTab("all")}
              >
                All PACs ({allPacItems.length})
              </button>
              <button
                type="button"
                className={`${styles.pacTabBtn} ${pacTab === "pacs" ? styles.active : ""}`}
                onClick={() => setPacTab("pacs")}
              >
                Traditional PACs ({pacs.length})
              </button>
              <button
                type="button"
                className={`${styles.pacTabBtn} ${pacTab === "superPacs" ? styles.active : ""}`}
                onClick={() => setPacTab("superPacs")}
              >
                Super PACs ({superPacs.length})
              </button>
            </div>
          </div>

          <div className={styles.pacList}>
            {displayPacItems.map((item: PacItem, idx: number) => {
              const isSuper = item.type.toLowerCase().includes("super");
              const fillPct = Math.min(100, Math.max(6, (item.amount / maxPacAmount) * 100));

              return (
                <div key={idx} className={styles.pacItem}>
                  <div className={styles.pacTop}>
                    <span className={styles.pacName}>{item.name}</span>
                    <span className={styles.pacAmount}>{formatCurrency(item.amount)}</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${isSuper ? styles.superFill : ""}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <div className={styles.pacMeta}>
                    <span>Type: {item.type}</span>
                    <span>Direct FEC Schedule A Filing</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Multi-Cycle Stacked History Bar Chart */}
      {data.history && data.history.length > 0 && (
        <div className={styles.historySection}>
          <h4>Historical Cycle Growth (D3.js Stacked Analysis)</h4>
          <div className={styles.svgContainer}>
            <svg ref={barSvgRef} />
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: "#3b82f6" }} />
              <span>Small & Grassroots (&lt;$200)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: "#10b981" }} />
              <span>PAC Direct</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: "#f59e0b" }} />
              <span>Super PAC Independent</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Contributors & Employer Sectors */}
      {topDonors.length > 0 && (
        <div className={styles.topDonorsSection}>
          <h4>
            <span>Top Contributors & Employer Sectors ({activeKey})</span>
            {topDonors.length > 5 && (
              <button
                type="button"
                className={styles.expandBtn}
                onClick={() => setIsDonorsExpanded(!isDonorsExpanded)}
              >
                {isDonorsExpanded ? "Show Less" : `View All ${topDonors.length}`}
              </button>
            )}
          </h4>
          <ul className={styles.donorList}>
            {displayDonors.map((donor: TopDonorItem, idx: number) => {
              const isExpanded = expandedDonors.has(idx);
              return (
                <li key={idx} className={styles.donorItem}>
                  <div className={styles.donorMain}>
                    <span className={styles.donorName}>{donor.name}</span>
                    <span className={styles.donorAmount}>{formatCurrency(donor.total_amount)}</span>
                  </div>
                  {donor.pac_amount > 0 || donor.individual_amount > 0 ? (
                    <div>
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => toggleDonorExpand(idx)}
                      >
                        {isExpanded ? "Hide Breakdown" : "View Breakdown"}
                      </button>
                      {isExpanded && (
                        <div className={styles.donorBreakdown}>
                          <span>Individuals: {formatCurrency(donor.individual_amount)}</span>
                          <span>PACs: {formatCurrency(donor.pac_amount)}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
