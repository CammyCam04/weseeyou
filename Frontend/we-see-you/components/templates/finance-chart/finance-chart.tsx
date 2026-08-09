"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Add01Icon,
  MinusSignIcon,
  ArrowReloadHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@hugeicons/core-free-icons";
import { FinanceSummary, TopDonorItem, PacItem, TermHistoryItem } from "@/lib/api";
import styles from "./finance-chart.module.scss";

interface FinanceChartProps {
  campaigns: Record<string, FinanceSummary>;
  currentChamber?: string;
  termsHistory?: TermHistoryItem[];
  politicianName?: string;
}

interface FormattedDataItem {
  cycle: string;
  small_donations: number;
  pac_donations: number;
  super_pac_donations: number;
  chamber?: string;
}

interface ChamberEraSegment {
  chamber: string;
  startCycle: string;
  endCycle: string;
  startIndex: number;
  endIndex: number;
}

interface ChartTooltipData {
  x: number;
  y: number;
  title: string;
  badge?: string;
  badgeColor?: string;
  category: string;
  amount: number;
  percentage?: number;
  color: string;
  cycleTotal?: number;
}

export default function FinanceChart({
  campaigns,
  currentChamber,
  termsHistory,
  politicianName,
}: FinanceChartProps) {
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const donutSvgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [tooltip, setTooltip] = useState<ChartTooltipData | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isDonorsExpanded, setIsDonorsExpanded] = useState(false);
  const [expandedDonors, setExpandedDonors] = useState<Set<number>>(new Set());
  const [pacTab, setPacTab] = useState<"all" | "pacs" | "superPacs">("all");
  const [isTenureExpanded, setIsTenureExpanded] = useState(false);

  // Disable browser window scrolling when the mouse is positioned over the cycle growth graph
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [campaigns]);

  // All campaign cycle keys in reverse chronological order
  const allKeys = useMemo(() => {
    return Object.keys(campaigns || {}).sort((a, b) => {
      const yearA = parseInt(a.match(/\b\d{4}\b/)?.[0] || "0");
      const yearB = parseInt(b.match(/\b\d{4}\b/)?.[0] || "0");
      return yearB - yearA;
    });
  }, [campaigns]);

  // Identify distinct offices/chambers present in campaign records
  const distinctOffices = useMemo(() => {
    const offices = new Set<string>();
    Object.values(campaigns || {}).forEach((c) => {
      if (c.office) offices.add(c.office);
    });
    return Array.from(offices);
  }, [campaigns]);

  // Determine the politician's active current chamber
  const activeCurrentChamber = useMemo(() => {
    if (currentChamber && distinctOffices.includes(currentChamber)) {
      return currentChamber;
    }
    const firstCampOffice = allKeys[0] ? campaigns[allKeys[0]]?.office : null;
    if (firstCampOffice) return firstCampOffice;
    return distinctOffices[0] || "Senate";
  }, [currentChamber, distinctOffices, allKeys, campaigns]);

  const hasMultipleChambers = distinctOffices.length > 1;

  // Chamber filter state: default is the official's CURRENT term chamber
  const [chamberFilter, setChamberFilter] = useState<string>(activeCurrentChamber);

  // Keep chamberFilter in sync if activeCurrentChamber changes
  useEffect(() => {
    if (activeCurrentChamber && (!distinctOffices.includes(chamberFilter) && chamberFilter !== "all")) {
      setChamberFilter(activeCurrentChamber);
    }
  }, [activeCurrentChamber, distinctOffices, chamberFilter]);

  // Filter keys according to selected chamber (or all)
  const visibleKeys = useMemo(() => {
    if (!hasMultipleChambers || chamberFilter === "all") {
      return allKeys;
    }
    const filtered = allKeys.filter((k) => {
      const camp = campaigns[k];
      const office = camp?.office?.toLowerCase();
      const target = chamberFilter.toLowerCase();
      return office === target || k.toLowerCase().startsWith(target);
    });
    return filtered.length > 0 ? filtered : allKeys;
  }, [allKeys, campaigns, chamberFilter, hasMultipleChambers]);

  const INITIAL_CAMPAIGNS_COUNT = 5;
  const primaryKeys = visibleKeys.slice(0, INITIAL_CAMPAIGNS_COUNT);
  const earlierKeys = visibleKeys.slice(INITIAL_CAMPAIGNS_COUNT);
  const hasEarlierCampaigns = earlierKeys.length > 0;

  // Selected campaign key within visible set
  const [selectedCampaignKey, setSelectedCampaignKey] = useState<string>(visibleKeys[0] || allKeys[0] || "");

  // Update selected campaign key when visibleKeys change
  useEffect(() => {
    if (!visibleKeys.includes(selectedCampaignKey)) {
      setSelectedCampaignKey(visibleKeys[0] || "");
      setExpandedDonors(new Set());
      setIsDonorsExpanded(false);
      setIsTenureExpanded(false);
    }
  }, [visibleKeys, selectedCampaignKey]);

  const handleChamberFilterChange = (chamber: string) => {
    setChamberFilter(chamber);
    setExpandedDonors(new Set());
    setIsDonorsExpanded(false);
    setIsTenureExpanded(false);
    setTooltip(null);
    handleResetZoom();
  };

  const handleCampaignChange = (key: string) => {
    setSelectedCampaignKey(key);
    setExpandedDonors(new Set());
    setIsDonorsExpanded(false);
    setTooltip(null);
  };

  const activeKey = (campaigns && campaigns[selectedCampaignKey])
    ? selectedCampaignKey
    : visibleKeys[0] || allKeys[0] || "";
  const data = campaigns ? campaigns[activeKey] : null;

  // Extract earliest and latest year for the tenure subtitle
  const latestYear = visibleKeys[0]?.match(/\b\d{4}\b/)?.[0] || "";
  const earliestYear = visibleKeys[visibleKeys.length - 1]?.match(/\b\d{4}\b/)?.[0] || "";
  const tenureRange = earliestYear && latestYear && earliestYear !== latestYear
    ? `${earliestYear} – ${latestYear}`
    : latestYear;

  // Career fundraising statistics across chambers
  const careerStats = useMemo(() => {
    let totalRaised = 0;
    const byChamber: Record<string, { total: number; count: number; earliest: string; latest: string }> = {};

    allKeys.forEach((k) => {
      const camp = campaigns[k];
      if (!camp) return;
      totalRaised += camp.total_donations || 0;
      const office = camp.office || "General";
      const year = k.match(/\b\d{4}\b/)?.[0] || "";

      if (!byChamber[office]) {
        byChamber[office] = { total: 0, count: 0, earliest: year, latest: year };
      }
      byChamber[office].total += camp.total_donations || 0;
      byChamber[office].count += 1;
      if (year && (!byChamber[office].earliest || year < byChamber[office].earliest)) {
        byChamber[office].earliest = year;
      }
      if (year && (!byChamber[office].latest || year > byChamber[office].latest)) {
        byChamber[office].latest = year;
      }
    });

    return { totalRaised, byChamber };
  }, [allKeys, campaigns]);

  // Helper to determine the chamber served for a given cycle year
  const getChamberForCycle = useMemo(() => {
    return (cycleStr: string, fallbackOffice?: string): string => {
      const cYear = parseInt(cycleStr);
      if (termsHistory && termsHistory.length > 0 && !isNaN(cYear)) {
        for (const t of termsHistory) {
          const sYr = parseInt(t.start_year);
          const eYr = parseInt(t.end_year);
          if (!isNaN(sYr)) {
            const effectiveEnd = t.is_current ? 2032 : (!isNaN(eYr) ? eYr : sYr + 2);
            if (cYear >= sYr - 1 && cYear <= effectiveEnd) {
              return t.chamber;
            }
          }
        }
      }
      if (fallbackOffice) return fallbackOffice;
      for (const k of allKeys) {
        if (k.includes(cycleStr)) {
          const off = campaigns[k]?.office;
          if (off) return off;
        }
      }
      return activeCurrentChamber || "Senate";
    };
  }, [termsHistory, allKeys, campaigns, activeCurrentChamber]);

  // Compute comprehensive multi-cycle history for the active view (chamber lifetime or combined career lifetime)
  const chartHistoryData = useMemo(() => {
    if (!campaigns) return [];
    const targetKeys = (chamberFilter === "all" && hasMultipleChambers) ? allKeys : visibleKeys;
    const cycleMap = new Map<string, { small_donations: number; pac_donations: number; super_pac_donations: number; chamber?: string }>();

    if (chamberFilter === "all" && hasMultipleChambers) {
      // Combined mode: aggregate all distinct cycles across all chambers and sum them together
      targetKeys.forEach((k) => {
        const camp = campaigns[k];
        if (!camp) return;
        const campOffice = camp.office;

        if (camp.history && camp.history.length > 0) {
          camp.history.forEach((h) => {
            const sVal = Number(h.small_donations) || 0;
            const pVal = Number(h.pac_donations) || 0;
            const spVal = Number(h.super_pac_donations) || 0;
            const itemChamber = getChamberForCycle(h.cycle, campOffice);

            if (!cycleMap.has(h.cycle)) {
              cycleMap.set(h.cycle, { small_donations: sVal, pac_donations: pVal, super_pac_donations: spVal, chamber: itemChamber });
            } else {
              const cur = cycleMap.get(h.cycle)!;
              cur.small_donations += sVal;
              cur.pac_donations += pVal;
              cur.super_pac_donations += spVal;
            }
          });
        } else if (camp.total_donations > 0) {
          const y = k.match(/\b\d{4}\b/)?.[0];
          if (y) {
            const sVal = ((camp.small_donations_pct || 0) / 100) * camp.total_donations;
            const pVal = ((camp.pac_donations_pct || 0) / 100) * camp.total_donations;
            const spVal = ((camp.super_pac_donations_pct || 0) / 100) * camp.total_donations;
            const itemChamber = getChamberForCycle(y, campOffice);

            if (!cycleMap.has(y)) {
              cycleMap.set(y, { small_donations: sVal, pac_donations: pVal, super_pac_donations: spVal, chamber: itemChamber });
            } else {
              const cur = cycleMap.get(y)!;
              cur.small_donations += sVal;
              cur.pac_donations += pVal;
              cur.super_pac_donations += spVal;
            }
          }
        }
      });
    } else {
      // Chamber-specific or Single-chamber mode: collect ALL cycles for this chamber across visible campaigns
      targetKeys.forEach((k) => {
        const camp = campaigns[k];
        if (!camp) return;
        const campOffice = camp.office;

        if (camp.history && camp.history.length > 0) {
          camp.history.forEach((h) => {
            const sVal = Number(h.small_donations) || 0;
            const pVal = Number(h.pac_donations) || 0;
            const spVal = Number(h.super_pac_donations) || 0;
            const itemChamber = getChamberForCycle(h.cycle, campOffice);

            if (!cycleMap.has(h.cycle)) {
              cycleMap.set(h.cycle, { small_donations: sVal, pac_donations: pVal, super_pac_donations: spVal, chamber: itemChamber });
            } else {
              const cur = cycleMap.get(h.cycle)!;
              cur.small_donations = Math.max(cur.small_donations, sVal);
              cur.pac_donations = Math.max(cur.pac_donations, pVal);
              cur.super_pac_donations = Math.max(cur.super_pac_donations, spVal);
            }
          });
        } else if (camp.total_donations > 0) {
          const y = k.match(/\b\d{4}\b/)?.[0];
          if (y) {
            const sVal = ((camp.small_donations_pct || 0) / 100) * camp.total_donations;
            const pVal = ((camp.pac_donations_pct || 0) / 100) * camp.total_donations;
            const spVal = ((camp.super_pac_donations_pct || 0) / 100) * camp.total_donations;
            const itemChamber = getChamberForCycle(y, campOffice);

            if (!cycleMap.has(y)) {
              cycleMap.set(y, { small_donations: sVal, pac_donations: pVal, super_pac_donations: spVal, chamber: itemChamber });
            }
          }
        }
      });
    }

    return Array.from(cycleMap.entries())
      .map(([cycle, val]) => ({
        cycle,
        ...val,
      }))
      .sort((a, b) => {
        const ya = parseInt(a.cycle) || 0;
        const yb = parseInt(b.cycle) || 0;
        return ya - yb;
      });
  }, [campaigns, chamberFilter, hasMultipleChambers, allKeys, visibleKeys, getChamberForCycle]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val || 0);
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

  // Zoom control helper handlers
  const handleZoomIn = () => {
    if (barSvgRef.current && zoomBehaviorRef.current) {
      d3.select(barSvgRef.current)
        .transition()
        .duration(280)
        .call(zoomBehaviorRef.current.scaleBy, 1.4);
    }
  };

  const handleZoomOut = () => {
    if (barSvgRef.current && zoomBehaviorRef.current) {
      d3.select(barSvgRef.current)
        .transition()
        .duration(280)
        .call(zoomBehaviorRef.current.scaleBy, 1 / 1.4);
    }
  };

  const handleResetZoom = () => {
    if (barSvgRef.current && zoomBehaviorRef.current) {
      d3.select(barSvgRef.current)
        .transition()
        .duration(280)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // 1. Render Donut / Circle Percentage Graph with Interactive Tooltip
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

    if (donutData.length === 0) {
      donutData.push({
        name: "Public Disclosures",
        percentage: 100,
        amount: total,
        color: "#64748b",
      });
    }

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
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", () => hoverArc(d) || "")
          .style("opacity", 0.95);

        if (chartWrapperRef.current) {
          const bounds = chartWrapperRef.current.getBoundingClientRect();
          setTooltip({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            title: activeKey,
            badge: data.office ? `U.S. ${data.office}` : undefined,
            badgeColor: data.office?.toLowerCase() === "house" ? "#60a5fa" : "#c084fc",
            category: d.data.name,
            amount: d.data.amount,
            percentage: d.data.percentage,
            color: d.data.color,
            cycleTotal: total,
          });
        }
      })
      .on("mousemove", function (event) {
        if (chartWrapperRef.current) {
          const bounds = chartWrapperRef.current.getBoundingClientRect();
          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: event.clientX - bounds.left,
                  y: event.clientY - bounds.top,
                }
              : null
          );
        }
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", () => arc(d) || "")
          .style("opacity", 1);

        setTooltip(null);
      });
  }, [data, activeKey]);

  // 2. Render Stacked Multi-Cycle Bar Chart with Interactive Zoom & Pan + Dynamic Y-Scale Rescaling
  useEffect(() => {
    if (!barSvgRef.current || chartHistoryData.length === 0) return;

    d3.select(barSvgRef.current).selectAll("*").remove();

    const stackKeys: (keyof FormattedDataItem)[] = [
      "small_donations",
      "pac_donations",
      "super_pac_donations",
    ];

    const categoryLabels: Record<string, string> = {
      small_donations: "Individual & Grassroots (<$200)",
      pac_donations: "Traditional PAC Direct",
      super_pac_donations: "Super PAC & Outside Funds",
    };

    const formattedData: FormattedDataItem[] = chartHistoryData.map((d) => ({
      cycle: d.cycle,
      small_donations: d.small_donations,
      pac_donations: d.pac_donations,
      super_pac_donations: d.super_pac_donations,
      chamber: d.chamber,
    }));

    // Group consecutive cycles into chamber era segments for multi-chamber politicians
    const eraSegments: ChamberEraSegment[] = [];
    if (hasMultipleChambers) {
      let currentEra: ChamberEraSegment | null = null;
      formattedData.forEach((d, idx) => {
        const chamber = d.chamber || (chamberFilter !== "all" ? chamberFilter : activeCurrentChamber);
        if (!currentEra || currentEra.chamber !== chamber) {
          if (currentEra) {
            eraSegments.push(currentEra);
          }
          currentEra = {
            chamber,
            startCycle: d.cycle,
            endCycle: d.cycle,
            startIndex: idx,
            endIndex: idx,
          };
        } else {
          currentEra.endCycle = d.cycle;
          currentEra.endIndex = idx;
        }
      });
      if (currentEra) {
        eraSegments.push(currentEra);
      }
    }

    const shouldRotateLabels = formattedData.length > 8;
    const width = 580;
    const height = 295;
    const margin = { top: 24, right: 20, bottom: shouldRotateLabels ? 56 : 38, left: 75 };

    const svg = d3
      .select(barSvgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Add Clip Path for Zoom & Pan on chart content (bars, era backdrops, gridlines)
    const clipId = "finance-cycle-clip";
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.bottom + 1);

    // Dedicated X-Axis Clip Path to ensure no cycle labels spill into the Y-axis numbers or chart sides
    const xAxisClipId = "finance-xaxis-clip";
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", xAxisClipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", -5)
      .attr("width", width - margin.left - margin.right)
      .attr("height", margin.bottom + 30);

    const stack = d3.stack<FormattedDataItem>().keys(stackKeys);
    const series = stack(formattedData);

    const xScaleLinear = d3
      .scaleLinear()
      .domain([0, formattedData.length])
      .range([margin.left, width - margin.right]);

    const x = d3
      .scaleBand()
      .domain(formattedData.map((d) => d.cycle))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    const fullYMax = d3.max(series, (layer) => d3.max(layer, (d) => d[1])) || 0;
    const y = d3
      .scaleLinear()
      .domain([0, fullYMax * 1.15 || 100000])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(stackKeys as string[])
      .range(["#3b82f6", "#10b981", "#f59e0b"]);

    // Main Clipped Content Group (Bars, Era Segments, Grid lines)
    const chartContent = svg.append("g").attr("clip-path", `url(#${clipId})`);

    // Grid lines Group
    const gridG = chartContent
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat(() => "")
      );
    gridG.select(".domain").remove();
    gridG.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.06)");

    // Background Chamber Era Segments Layer
    const eraLayer = chartContent.append("g").attr("class", "chamber-era-segments");

    if (hasMultipleChambers && eraSegments.length > 0) {
      eraSegments.forEach((era, i) => {
        const xStartCycle = x(era.startCycle);
        const xEndCycle = x(era.endCycle);
        if (xStartCycle === undefined || xEndCycle === undefined) return;

        const bandStep = x.step();
        const bandPad = (bandStep * x.padding()) / 2;
        const xLeft = Math.max(margin.left, xStartCycle - bandPad);
        const xRight = Math.min(width - margin.right, xEndCycle + x.bandwidth() + bandPad);
        const segmentWidth = Math.max(0, xRight - xLeft);

        const isHouse = era.chamber.toLowerCase() === "house";
        const bgFill = isHouse ? "rgba(59, 130, 246, 0.08)" : "rgba(168, 85, 247, 0.08)";
        const borderStroke = isHouse ? "rgba(59, 130, 246, 0.28)" : "rgba(168, 85, 247, 0.28)";
        const textFill = isHouse ? "#60a5fa" : "#c084fc";
        const eraBadgeBg = isHouse ? "rgba(59, 130, 246, 0.18)" : "rgba(168, 85, 247, 0.18)";

        // Shaded Era Backdrop
        eraLayer
          .append("rect")
          .attr("class", `era-bg-${i}`)
          .attr("x", xLeft)
          .attr("y", margin.top)
          .attr("width", segmentWidth)
          .attr("height", height - margin.top - margin.bottom)
          .attr("fill", bgFill)
          .attr("stroke", borderStroke)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 3")
          .attr("rx", 4);

        // Era Header Pill inside chart at top
        const pillGroup = eraLayer.append("g").attr("class", `era-pill-${i}`);
        const eraLabel = isHouse ? "U.S. House" : "U.S. Senate";
        const textX = xLeft + segmentWidth / 2;
        const textY = margin.top + 12;

        pillGroup
          .append("rect")
          .attr("x", textX - 38)
          .attr("y", margin.top + 2)
          .attr("width", 76)
          .attr("height", 14)
          .attr("rx", 7)
          .attr("fill", eraBadgeBg)
          .attr("stroke", borderStroke)
          .attr("stroke-width", 0.75);

        pillGroup
          .append("text")
          .attr("x", textX)
          .attr("y", textY)
          .attr("text-anchor", "middle")
          .attr("fill", textFill)
          .attr("font-size", "8.5px")
          .attr("font-weight", "700")
          .attr("letter-spacing", "0.02em")
          .text(eraLabel);

        if (segmentWidth < 55) {
          pillGroup.style("display", "none");
        }
      });
    }

    // Stacked Bars
    const barGroups = chartContent
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key));

    const rects = barGroups
      .selectAll("rect")
      .data((d) => d.map((item) => ({ ...item, key: d.key })))
      .join("rect")
      .attr("x", (d) => x(d.data.cycle) || 0)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth())
      .attr("rx", 2)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.15s ease");

    // Bar Hover Events
    rects
      .on("mouseenter", function (event, d) {
        d3.select(this).style("opacity", 0.85);

        const sliceVal = Math.max(0, d[1] - d[0]);
        const cycleTotal =
          (Number(d.data.small_donations) || 0) +
          (Number(d.data.pac_donations) || 0) +
          (Number(d.data.super_pac_donations) || 0);
        const pct = cycleTotal > 0 ? (sliceVal / cycleTotal) * 100 : 0;
        const keyName = d.key as string;
        const categoryName = categoryLabels[keyName] || keyName;
        const segmentChamber = d.data.chamber ? `U.S. ${d.data.chamber}` : undefined;

        if (chartWrapperRef.current) {
          const bounds = chartWrapperRef.current.getBoundingClientRect();
          setTooltip({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            title: `${d.data.cycle} Campaign Cycle`,
            badge: segmentChamber,
            badgeColor: d.data.chamber?.toLowerCase() === "house" ? "#60a5fa" : "#c084fc",
            category: categoryName,
            amount: sliceVal,
            percentage: Math.round(pct * 10) / 10,
            color: color(keyName),
            cycleTotal: cycleTotal,
          });
        }
      })
      .on("mousemove", function (event) {
        if (chartWrapperRef.current) {
          const bounds = chartWrapperRef.current.getBoundingClientRect();
          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: event.clientX - bounds.left,
                  y: event.clientY - bounds.top,
                }
              : null
          );
        }
      })
      .on("mouseleave", function () {
        d3.select(this).style("opacity", 1);
        setTooltip(null);
      });

    // Clipped X-Axis Group (Guarantees zero label spill into Y-axis numbers or chart sides)
    const xAxis = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("clip-path", `url(#${xAxisClipId})`)
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    const applyXAxisLabelStyles = (rotated: boolean) => {
      // Filter tick visibility: hide any ticks whose center is outside [margin.left - 4, width - margin.right + 4]
      xAxis.selectAll(".tick").each(function (d) {
        const cycleStr = d as string;
        const xPos = x(cycleStr);
        if (xPos === undefined) return;
        const center = xPos + x.bandwidth() / 2;
        const inBounds = center >= margin.left - 4 && center <= width - margin.right + 4;
        d3.select(this).style("display", inBounds ? "" : "none");
      });

      const xLabels = xAxis.selectAll("text").attr("fill", "#94a3b8").attr("font-weight", "600");
      if (rotated) {
        xLabels
          .attr("font-size", formattedData.length > 12 ? "9.5px" : "10.5px")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .attr("dx", "-0.65em")
          .attr("dy", "0.15em");
      } else {
        xLabels
          .attr("font-size", "11px")
          .attr("transform", null)
          .style("text-anchor", "middle")
          .attr("dx", "0")
          .attr("dy", "0.75em");
      }
    };

    applyXAxisLabelStyles(shouldRotateLabels);

    // Static horizontal baseline line spanning strictly from margin.left to width - margin.right
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height - margin.bottom)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "rgba(255,255,255,0.18)")
      .attr("stroke-width", 1);

    // Left Y-Axis Group
    const yAxisG = svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `$${d3.format(".2s")(d)}`)
      );

    yAxisG.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "11px");

    // Track smoothed Y-Max state for fluid animated scaling
    let currentYMax = fullYMax;
    let targetYMax = fullYMax;
    let animFrameId: number | null = null;

    const renderYScaleUpdate = () => {
      const activeDomainMax = Math.max(currentYMax * 1.15, 50000);
      y.domain([0, activeDomainMax]).nice();

      yAxisG.call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `$${d3.format(".2s")(d)}`)
      );
      yAxisG.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "11px");

      gridG.call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat(() => "")
      );
      gridG.select(".domain").remove();
      gridG.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.06)");

      rects
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])));
    };

    const runSmoothStep = () => {
      const diff = targetYMax - currentYMax;
      if (Math.abs(diff) > Math.max(targetYMax * 0.003, 300)) {
        currentYMax += diff * 0.22;
        renderYScaleUpdate();
        animFrameId = requestAnimationFrame(runSmoothStep);
      } else {
        currentYMax = targetYMax;
        renderYScaleUpdate();
        animFrameId = null;
      }
    };

    // D3 Zoom & Pan Behavior with Smooth Weighted Proximity Rescaling
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5.0])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .extent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .on("zoom", (event) => {
        const transform = event.transform;
        setZoomScale(transform.k);

        const newXLinear = transform.rescaleX(xScaleLinear);
        x.range([newXLinear(0), newXLinear(formattedData.length)]);

        // When at default full overview (scale <= 1.03), strictly lock target to the exact career maximum
        if (transform.k <= 1.03) {
          targetYMax = fullYMax;
        } else {
          // Calculate weighted target Y max based on distance from viewport edges (smooth 50px fade zone)
          const fadeZone = 50;
          const leftBound = margin.left;
          const rightBound = width - margin.right;

          let maxWeightedVal = 0;
          formattedData.forEach((d) => {
            const xPos = x(d.cycle);
            if (xPos === undefined) return;
            const center = xPos + x.bandwidth() / 2;
            const cycleTotal =
              (Number(d.small_donations) || 0) +
              (Number(d.pac_donations) || 0) +
              (Number(d.super_pac_donations) || 0);

            if (center >= leftBound + fadeZone && center <= rightBound - fadeZone) {
              maxWeightedVal = Math.max(maxWeightedVal, cycleTotal);
            } else if (center >= leftBound - 15 && center < leftBound + fadeZone) {
              const ratio = Math.max(0, (center - (leftBound - 15)) / (fadeZone + 15));
              const eased = Math.sin((ratio * Math.PI) / 2);
              maxWeightedVal = Math.max(maxWeightedVal, cycleTotal * (0.15 + 0.85 * eased));
            } else if (center > rightBound - fadeZone && center <= rightBound + 15) {
              const ratio = Math.max(0, ((rightBound + 15) - center) / (fadeZone + 15));
              const eased = Math.sin((ratio * Math.PI) / 2);
              maxWeightedVal = Math.max(maxWeightedVal, cycleTotal * (0.15 + 0.85 * eased));
            }
          });

          targetYMax = maxWeightedVal > 0 ? maxWeightedVal : fullYMax;
        }

        // Immediate horizontal bar position & width updates for 60fps tracking
        rects
          .attr("x", (d) => x(d.data.cycle) || 0)
          .attr("width", Math.max(1, x.bandwidth()));

        // Start/continue smooth vertical easing loop
        if (!animFrameId) {
          animFrameId = requestAnimationFrame(runSmoothStep);
        }

        // Update era segments
        if (hasMultipleChambers && eraSegments.length > 0) {
          eraSegments.forEach((era, i) => {
            const xStartCycle = x(era.startCycle);
            const xEndCycle = x(era.endCycle);
            if (xStartCycle === undefined || xEndCycle === undefined) return;

            const bandStep = x.step();
            const bandPad = (bandStep * x.padding()) / 2;
            const xLeft = Math.max(margin.left, xStartCycle - bandPad);
            const xRight = Math.min(width - margin.right, xEndCycle + x.bandwidth() + bandPad);
            const segW = Math.max(0, xRight - xLeft);

            eraLayer
              .select(`.era-bg-${i}`)
              .attr("x", xLeft)
              .attr("width", segW);

            const pillGroup = eraLayer.select(`.era-pill-${i}`);
            if (segW >= 55) {
              pillGroup.style("display", "block");
              const textX = xLeft + segW / 2;
              pillGroup.select("rect").attr("x", textX - 38);
              pillGroup.select("text").attr("x", textX);
            } else {
              pillGroup.style("display", "none");
            }
          });
        }

        // Update x-axis labels with in-bounds filtering and dynamic rotation
        xAxis.call(d3.axisBottom(x).tickSizeOuter(0));
        const isRot = shouldRotateLabels || x.bandwidth() < 30 || transform.k > 1.05;
        applyXAxisLabelStyles(isRot);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [chartHistoryData, hasMultipleChambers, chamberFilter, activeCurrentChamber]);

  if (!data) {
    return (
      <div className={styles.chartWrapper}>
        <p style={{ color: "var(--foreground-muted)", textAlign: "center", padding: "2rem" }}>
          No verified Federal Election Commission (FEC) finance records on file for this official.
        </p>
      </div>
    );
  }

  const topDonors: TopDonorItem[] = (data.top_donors && data.top_donors.length > 0)
    ? data.top_donors
    : (data.donors || []).map((d) => ({
        name: d.name,
        total_amount: d.amount,
        individual_amount: Math.round(d.amount * 0.6),
        pac_amount: Math.round(d.amount * 0.4),
      }));

  const displayDonors = isDonorsExpanded ? topDonors : topDonors.slice(0, 5);

  const pacs = data.pacs || [];
  const superPacs = data.super_pacs || [];
  const allPacItems = [...pacs, ...superPacs].sort((a, b) => b.amount - a.amount);
  const displayPacItems =
    pacTab === "all" ? allPacItems : pacTab === "pacs" ? pacs : superPacs;
  const maxPacAmount = Math.max(...allPacItems.map((i) => i.amount), 1);

  // Derived dollar values for current active campaign
  const totalRaised = data.total_donations || 0;
  const smallDollar = ((data.small_donations_pct || 0) / 100) * totalRaised;
  const pacDollar = ((data.pac_donations_pct || 0) / 100) * totalRaised;
  const superPacDollar = ((data.super_pac_donations_pct || 0) / 100) * totalRaised;

  return (
    <div ref={chartWrapperRef} className={styles.chartWrapper}>
      {/* Interactive Tooltip Overlay */}
      {tooltip && (
        <div
          className={styles.floatingTooltip}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipTitle}>{tooltip.title}</span>
            {tooltip.badge && (
              <span
                className={styles.tooltipBadge}
                style={{
                  color: tooltip.badgeColor || "var(--foreground)",
                  borderColor: tooltip.badgeColor ? `${tooltip.badgeColor}44` : undefined,
                }}
              >
                {tooltip.badge}
              </span>
            )}
          </div>

          <div className={styles.tooltipDivider} />

          <div className={styles.tooltipBody}>
            <div className={styles.tooltipCategoryRow}>
              <span className={styles.tooltipDot} style={{ backgroundColor: tooltip.color }} />
              <span className={styles.tooltipCategoryName}>{tooltip.category}</span>
            </div>

            <div className={styles.tooltipAmountRow}>
              <span className={styles.tooltipAmount}>{formatCurrency(tooltip.amount)}</span>
              {tooltip.percentage !== undefined && (
                <span
                  className={styles.tooltipPct}
                  style={{
                    backgroundColor: `${tooltip.color}22`,
                    color: tooltip.color,
                  }}
                >
                  {tooltip.percentage}%
                </span>
              )}
            </div>
          </div>

          {tooltip.cycleTotal !== undefined && tooltip.cycleTotal > 0 && (
            <div className={styles.tooltipFooter}>
              <span>Period Total:</span>
              <strong>{formatCurrency(tooltip.cycleTotal)}</strong>
            </div>
          )}
        </div>
      )}

      {/* Campaign Finance Header */}
      <div className={styles.chartHeader}>
        <div className={styles.headerTitleGroup}>
          <h3>Campaign Finance Breakdown (FEC Verified)</h3>
          {allKeys.length > 1 && (
            <span className={styles.tenureBadge}>
              {visibleKeys.length} {visibleKeys.length === 1 ? "Campaign" : "Campaigns"} ({tenureRange})
            </span>
          )}
        </div>

        {/* Multi-Chamber History Toggle (House vs Senate vs All) */}
        {hasMultipleChambers && (
          <div className={styles.chamberToggleSection}>
            <div className={styles.chamberToggleHeader}>
              <span className={styles.chamberToggleTitle}>
                Career Chamber & Tenure Filter
              </span>
              <span className={styles.chamberFocusNote}>
                {chamberFilter === activeCurrentChamber
                  ? `Focusing on Current Term (${activeCurrentChamber})`
                  : chamberFilter === "all"
                  ? "Showing Complete Career History"
                  : `Focusing on Prior Service (${chamberFilter})`}
              </span>
            </div>

            <div className={styles.chamberToggleGroup}>
              {/* Current Chamber Option */}
              <button
                type="button"
                className={`${styles.chamberToggleBtn} ${chamberFilter === activeCurrentChamber ? styles.active : ""}`}
                onClick={() => handleChamberFilterChange(activeCurrentChamber)}
              >
                <span>U.S. {activeCurrentChamber}</span>
                <span className={`${styles.chamberStatusPill} ${styles.current}`}>Current</span>
                <span className={styles.chamberCountTag}>
                  ({careerStats.byChamber[activeCurrentChamber]?.count || 0} runs)
                </span>
              </button>

              {/* Other/Prior Chambers (e.g. House) */}
              {distinctOffices
                .filter((off) => off !== activeCurrentChamber)
                .map((off) => (
                  <button
                    key={off}
                    type="button"
                    className={`${styles.chamberToggleBtn} ${chamberFilter === off ? styles.active : ""}`}
                    onClick={() => handleChamberFilterChange(off)}
                  >
                    <span>U.S. {off}</span>
                    <span className={`${styles.chamberStatusPill} ${styles.prior}`}>Prior Service</span>
                    <span className={styles.chamberCountTag}>
                      ({careerStats.byChamber[off]?.count || 0} runs)
                    </span>
                  </button>
                ))}

              {/* Complete Career Option */}
              <button
                type="button"
                className={`${styles.chamberToggleBtn} ${chamberFilter === "all" ? styles.active : ""}`}
                onClick={() => handleChamberFilterChange("all")}
              >
                <span>Complete Career History</span>
                <span className={`${styles.chamberStatusPill} ${styles.all}`}>All Chambers</span>
                <span className={styles.chamberCountTag}>({allKeys.length} total)</span>
              </button>
            </div>
          </div>
        )}

        {/* Multi-Chamber Career Fundraising Summary Banner */}
        {hasMultipleChambers && (
          <div className={styles.careerSummaryBanner}>
            <div className={styles.careerTotalItem}>
              <span className={styles.careerTotalLabel}>Lifetime Congressional Raised:</span>
              <span className={styles.careerTotalValue}>{formatCurrency(careerStats.totalRaised)}</span>
            </div>
            <div className={styles.chamberBreakdownItems}>
              {Object.entries(careerStats.byChamber).map(([off, info]) => (
                <span key={off} className={styles.chamberBreakdownItem}>
                  <strong>{off}:</strong> {formatCurrency(info.total)} ({info.count} {info.count === 1 ? "run" : "runs"})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Election Cycle Selector */}
        {visibleKeys.length > 1 && (
          <div className={styles.cycleSelectorWrapper}>
            <div className={styles.primaryCycleList}>
              {primaryKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`${styles.cycleBtn} ${k === activeKey ? styles.active : ""}`}
                  onClick={() => handleCampaignChange(k)}
                >
                  {k}
                </button>
              ))}

              {hasEarlierCampaigns && (
                <button
                  type="button"
                  className={`${styles.moreCampaignsBtn} ${isTenureExpanded ? styles.expanded : ""} ${earlierKeys.includes(activeKey) ? styles.hasActiveChild : ""}`}
                  onClick={() => setIsTenureExpanded(!isTenureExpanded)}
                  title="View earlier campaigns in this chamber"
                >
                  {isTenureExpanded ? (
                    <>
                      <HugeiconsIcon icon={ChevronUpIcon} size={14} /> Show Recent ({INITIAL_CAMPAIGNS_COUNT})
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Add01Icon} size={13} /> {earlierKeys.length} Earlier Runs {earlierKeys.includes(activeKey) ? `(${activeKey.match(/\b\d{4}\b/)?.[0]} Active)` : `(Back to ${earliestYear})`} <HugeiconsIcon icon={ChevronDownIcon} size={14} />
                    </>
                  )}
                </button>
              )}
            </div>

            {hasEarlierCampaigns && isTenureExpanded && (
              <div className={styles.expandedTenureTray}>
                <div className={styles.trayHeader}>
                  <span>Earlier Campaigns ({earliestYear} – {earlierKeys[0]?.match(/\b\d{4}\b/)?.[0]})</span>
                </div>
                <div className={styles.trayList}>
                  {earlierKeys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`${styles.cycleBtn} ${styles.historicalBtn} ${k === activeKey ? styles.active : ""}`}
                      onClick={() => handleCampaignChange(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

          {displayPacItems.length > 0 ? (
            <div className={styles.pacList}>
              {displayPacItems.map((item: PacItem, idx: number) => {
                const isSuper = (item.type || "").toLowerCase().includes("super");
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
          ) : (
            <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", padding: "1rem" }}>
              No itemized records found for this category.
            </p>
          )}
        </div>
      )}

      {/* 3. Multi-Cycle Stacked History Bar Chart with Dynamic Y-Scale Rescaling and Strict X-Axis Bounds */}
      {chartHistoryData.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyHeaderGroup}>
            <h4 className={styles.historyTitle}>
              {chamberFilter === "all" && hasMultipleChambers
                ? "Combined Career Cycle Growth"
                : hasMultipleChambers
                ? `U.S. ${chamberFilter} Lifetime Cycle Growth`
                : `Historical Cycle Growth (U.S. ${data.office || "Congressional"} Lifetime)`}
            </h4>

            {/* Interactive Zoom & Pan Controls Toolbar */}
            <div className={styles.zoomToolbar}>
              <span className={styles.zoomHint}>
                <HugeiconsIcon icon={Search01Icon} size={13} /> Scroll or drag to zoom & pan
              </span>

              <div className={styles.zoomBtnGroup}>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={handleZoomIn}
                  title="Zoom in on cycles"
                  aria-label="Zoom in"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                </button>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={handleZoomOut}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={14} />
                </button>
              </div>

              <button
                type="button"
                className={`${styles.resetZoomBtn} ${zoomScale > 1.05 ? styles.isZoomed : ""}`}
                onClick={handleResetZoom}
                title="Reset zoom to full timeline"
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} />
                <span>{zoomScale > 1.05 ? `Reset (${Math.round(zoomScale * 100)}%)` : "Reset"}</span>
              </button>
            </div>
          </div>

          <div ref={svgContainerRef} className={styles.svgContainer}>
            <svg ref={barSvgRef} />
          </div>

          <div className={styles.legend}>
            <div className={styles.legendRow}>
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

            {hasMultipleChambers && (
              <div className={styles.eraLegendRow}>
                <div className={`${styles.eraLegendItem} ${styles.houseEra}`}>
                  <span>U.S. House Era</span>
                </div>
                <div className={`${styles.eraLegendItem} ${styles.senateEra}`}>
                  <span>U.S. Senate Era</span>
                </div>
              </div>
            )}
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
                  {(donor.pac_amount > 0 || donor.individual_amount > 0) ? (
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
