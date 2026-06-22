// TypeScript types matching the backend models

export type Party = "D" | "R" | "I";
export type Chamber = "Senate" | "House" | "Executive";

export interface PoliticianSearchItem {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  state: string;
  party: Party;
  profile_image_url?: string;
}

export interface PoliticianDetail extends PoliticianSearchItem {
  chamber: Chamber;
  date_of_birth: string;
  gender: string;
  twitter_account?: string;
  facebook_account?: string;
  youtube_account?: string;
  website_url?: string;
  next_election?: string;
  stances: string[];
  affiliations: string[];
  controversies: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Fetch list of politicians matching a query string (or all if query is empty)
 */
export async function fetchPoliticians(query?: string): Promise<PoliticianSearchItem[]> {
  const url = new URL(`${API_BASE_URL}/politicians`);
  if (query) {
    url.searchParams.append("query", query);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 }, // Cache response for 60 seconds (Next.js specific)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch politicians: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch detailed profile of a politician by ID
 */
export async function fetchPoliticianById(id: string): Promise<PoliticianDetail> {
  const response = await fetch(`${API_BASE_URL}/politicians/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 }, // Cache response for 60 seconds
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Politician with ID ${id} not found`);
    }
    throw new Error(`Failed to fetch politician detail: ${response.statusText}`);
  }

  return response.json();
}

export interface ContributorItem {
  name: string;
  amount: number;
}

export interface DonorItem {
  name: string;
  amount: number;
  contributors: ContributorItem[];
}

export interface FinanceHistoryItem {
  cycle: string;
  small_donations: number;
  pac_donations: number;
  super_pac_donations: number;
}

export interface FinanceSummary {
  id: string;
  candidate_id: string;
  office: string;
  state: string;
  total_donations: number;
  small_donations_pct: number;
  pac_donations_pct: number;
  super_pac_donations_pct: number;
  history: FinanceHistoryItem[];
  donors: DonorItem[];
}


/**
 * Fetch campaign finance summary and history for a politician by ID
 */
export async function fetchPoliticianFinance(id: string): Promise<Record<string, FinanceSummary>> {
  const response = await fetch(`${API_BASE_URL}/politicians/${id}/finance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Finance records for Politician ID ${id} not found`);
    }
    throw new Error(`Failed to fetch politician finance records: ${response.statusText}`);
  }

  return response.json();
}

