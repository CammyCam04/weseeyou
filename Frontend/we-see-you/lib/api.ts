// TypeScript types matching the backend models

export type Party = "D" | "R" | "I";
export type Chamber = "Senate" | "House" | "Executive" | "Judicial";

export interface PoliticianSearchItem {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  state: string;
  party: Party;
  chamber: Chamber;
  profile_image_url?: string;
}

export interface SponsoredLegislationItem {
  bill_number: string;
  title: string;
  introduced_date: string;
  latest_action: string;
  congress_url: string;
}

export interface VotedLegislationItem {
  bill_number: string;
  title: string;
  vote_date: string;
  vote_position: string;
  result: string;
  description: string;
}

export interface ElectoralHistoryItem {
  year: string;
  office: string;
  vote_share_pct: number;
  margin_of_victory_pct: number;
  opponent_name?: string;
  total_votes?: number;
}

export interface PolicyStanceItem {
  category: string;
  position: string;
  summary: string;
}

export interface CivicContactInfo {
  official_address?: string;
  official_phone?: string;
  official_website?: string;
  office_name?: string;
}

export interface StockTradeItem {
  ticker: string;
  asset_name: string;
  transaction_type: string;
  transaction_date: string;
  disclosure_date: string;
  amount_range: string;
  owner: string;
}

export interface PartyAlignmentStats {
  party_line_vote_pct: number;
  missed_votes_pct: number;
  total_votes_eligible: number;
  total_votes_cast: number;
}

export interface DistrictDemographics {
  district_pvi: string;
  median_household_income: string;
  total_population: string;
  top_industries: string[];
}

export interface NewsArticleItem {
  title: string;
  source: string;
  publication_date: string;
  url: string;
  snippet?: string;
}

export interface TermHistoryItem {
  chamber: Chamber;
  title: string;
  state: string;
  district?: number;
  start_year: string;
  end_year: string;
  party?: Party;
  how?: string;
  is_current: boolean;
}

export interface PoliticianDetail extends PoliticianSearchItem {
  chamber: Chamber;
  date_of_birth?: string;
  gender?: string;
  twitter_account?: string;
  facebook_account?: string;
  youtube_account?: string;
  website_url?: string;
  next_election?: string;
  bio_summary?: string;
  wikipedia_id?: string;
  stances: string[];
  policy_stances?: PolicyStanceItem[];
  sponsored_legislation: SponsoredLegislationItem[];
  voted_legislation?: VotedLegislationItem[];
  electoral_history?: ElectoralHistoryItem[];
  civic_contact_info?: CivicContactInfo;
  stock_trades?: StockTradeItem[];
  party_alignment?: PartyAlignmentStats;
  district_demographics?: DistrictDemographics;
  news_feed?: NewsArticleItem[];
  affiliations: string[];
  controversies: string[];
  terms_history?: TermHistoryItem[];
  career_chambers?: string[];
  has_multi_chamber_history?: boolean;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "0.0.0.0")
    ? "http://127.0.0.1:8000/api"
    : "/api");

function buildApiUrl(path: string, params?: Record<string, string | undefined>): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const isAbsolute = API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://");

  if (isAbsolute) {
    const url = new URL(`${API_BASE_URL.replace(/\/$/, "")}${cleanPath}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== "") {
          url.searchParams.append(key, val);
        }
      });
    }
    return url.toString();
  }

  // Relative path (e.g. "/api/politicians")
  const base = API_BASE_URL.replace(/\/$/, "");
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") {
        searchParams.append(key, val);
      }
    });
  }
  const queryString = searchParams.toString();
  return `${base}${cleanPath}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Fetch list of politicians matching a query string (or all if query is empty)
 */
export async function fetchPoliticians(query?: string): Promise<PoliticianSearchItem[]> {
  const url = buildApiUrl("/politicians", query ? { query } : undefined);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
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
  const url = buildApiUrl(`/politicians/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
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

export interface PacItem {
  name: string;
  type: string;
  amount: number;
  percentage: number;
  date?: string;
}

export interface IndustrySectorItem {
  sector_name: string;
  amount: number;
  percentage: number;
}

export interface IndependentExpenditureItem {
  committee_name: string;
  support_or_oppose: string;
  amount: number;
  description?: string;
}

export interface TopDonorItem {
  name: string;
  total_amount: number;
  individual_amount: number;
  pac_amount: number;
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
  donors?: DonorItem[];
  top_donors?: TopDonorItem[];
  pacs?: PacItem[];
  super_pacs?: PacItem[];
  industry_sectors?: IndustrySectorItem[];
  independent_expenditures?: IndependentExpenditureItem[];
}

/**
 * Fetch campaign finance summary and history for a politician by ID
 */
export async function fetchPoliticianFinance(id: string): Promise<Record<string, FinanceSummary>> {
  const url = buildApiUrl(`/politicians/${encodeURIComponent(id)}/finance`);
  const response = await fetch(url, {
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

export interface PoliticianLegislationData {
  politician_name: string;
  sponsored: SponsoredLegislationItem[];
  voted: VotedLegislationItem[];
}

/**
 * Fetch all sponsored and voted legislation for a politician
 */
export async function fetchPoliticianLegislation(id: string): Promise<PoliticianLegislationData> {
  const url = buildApiUrl(`/politicians/${encodeURIComponent(id)}/legislation`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch legislation records: ${response.statusText}`);
  }

  return response.json();
}

export interface CommitteeMemberItem {
  bioguide_id: string;
  first_name: string;
  last_name: string;
  role: string;
  party: Party;
  state: string;
  title: string;
  profile_image_url?: string;
}

export interface SubcommitteeItem {
  id: string;
  name: string;
}

export interface CommitteeBillItem {
  bill_number: string;
  title: string;
  relationship_type: string;
  action_date: string;
  congress_url: string;
}

export interface CommitteeSearchItem {
  id: string;
  name: string;
  chamber: Chamber;
  type: string;
  member_count: number;
  subcommittee_count: number;
  chair_name?: string;
  ranking_member_name?: string;
}

export interface CommitteeDetail extends CommitteeSearchItem {
  website_url?: string;
  members: CommitteeMemberItem[];
  subcommittees: SubcommitteeItem[];
  bills: CommitteeBillItem[];
}

/**
 * Fetch list of committees with optional search query and chamber filter
 */
export async function fetchCommittees(query?: string, chamber?: string): Promise<CommitteeSearchItem[]> {
  const url = buildApiUrl("/committees", { query, chamber });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch committees: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch detail of a committee by ID
 */
export async function fetchCommitteeById(id: string): Promise<CommitteeDetail> {
  const url = buildApiUrl(`/committees/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Committee ${id} not found`);
    }
    throw new Error(`Failed to fetch committee detail: ${response.statusText}`);
  }

  return response.json();
}

export interface CandidateItem {
  id: string;
  name: string;
  office: string;
  state: string;
  district?: string;
  party: string;
  is_incumbent: boolean;
  fec_id?: string;
}

export interface CivicOfficialItem {
  id?: string;
  name: string;
  office_title: string;
  level: string;
  party?: string;
  phones: string[];
  urls: string[];
  photo_url?: string;
}

export interface CountyOfficialItem {
  title: string;
  name: string;
  party?: string;
  term_end?: string;
  phone?: string;
  email?: string;
  office_address?: string;
}

export interface LocalLookupResponse {
  state: string;
  county?: string;
  district?: string;
  incumbents: PoliticianDetail[];
  running_candidates: CandidateItem[];
  county_officials?: CountyOfficialItem[];
  township_candidates: CandidateItem[];
  civic_officials: CivicOfficialItem[];
}

export async function fetchStateCounties(state: string): Promise<string[]> {
  if (!state) return [];
  const url = buildApiUrl("/local/counties", { state });

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function fetchLocalElections(
  state: string,
  district?: string,
  address?: string,
  county?: string
): Promise<LocalLookupResponse> {
  const url = buildApiUrl("/local", { state, district, address, county });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch local election records: ${response.statusText}`);
  }

  return response.json();
}

export interface CandidateDetailResponse {
  id: string;
  name: string;
  office: string;
  state: string;
  district?: string;
  party: string;
  is_incumbent: boolean;
  fec_id?: string;
  election_year?: string;
  bio_summary?: string;
  contact_email?: string;
  website_url?: string;
  total_spent?: number;
  cash_on_hand?: number;
  debts_owed?: number;
  policy_stances?: PolicyStanceItem[];
  endorsements?: string[];
  finance?: FinanceSummary;
  sponsored_bills: SponsoredLegislationItem[];
}

export async function fetchCandidateById(candidateId: string): Promise<CandidateDetailResponse> {
  const url = buildApiUrl(`/candidates/${encodeURIComponent(candidateId)}`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Candidate record ${candidateId} not found`);
    }
    throw new Error(`Failed to fetch candidate profile: ${response.statusText}`);
  }

  return response.json();
}

export interface JudicialOpinionItem {
  case_name: string;
  year?: string;
  vote_count?: string;
  opinion_type?: string;
  summary: string;
  topic?: string;
  url?: string;
}

export interface JudgeBase {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  state: string;
  court_name: string;
  profile_image_url?: string;
}

export interface JudgeDetail extends JudgeBase {
  date_of_birth?: string;
  gender?: string;
  website_url?: string;
  tenure_type?: string;
  bio_summary?: string;
  wikipedia_id?: string;
  opinions: JudicialOpinionItem[];
  controversies: string[];
}

export async function fetchJudges(query?: string): Promise<JudgeBase[]> {
  const url = buildApiUrl("/judges", query ? { query } : undefined);

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch judicial roster: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchJudgeById(judgeId: string): Promise<JudgeDetail> {
  const url = buildApiUrl(`/judges/${encodeURIComponent(judgeId)}`);
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch judicial profile: ${response.statusText}`);
  }

  return response.json();
}
