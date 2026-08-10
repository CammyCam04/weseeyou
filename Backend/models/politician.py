# region Imports
from typing import List, Optional
from pydantic import BaseModel
from enums import Party, Chamber
# endregion

# region Models
class PoliticianBase(BaseModel):
    id: str
    first_name: str
    last_name: str
    title: str
    state: str
    party: Party
    chamber: Chamber
    profile_image_url: Optional[str] = None

class PoliticianSearchItem(PoliticianBase):
    pass

class SponsoredLegislationItem(BaseModel):
    bill_number: str
    title: str
    introduced_date: str
    latest_action: str
    congress_url: str

class VotedLegislationItem(BaseModel):
    bill_number: str
    title: str
    vote_date: str
    vote_position: str  # "YEA", "NAY", "PRESENT", "NOT VOTING"
    result: str         # "Passed", "Failed", "Agreed to", etc.
    description: str

class ElectoralHistoryItem(BaseModel):
    year: str
    office: str
    vote_share_pct: float
    margin_of_victory_pct: float
    opponent_name: Optional[str] = None
    total_votes: Optional[int] = None

class PolicyStanceItem(BaseModel):
    category: str
    position: str
    summary: str

class CivicContactInfo(BaseModel):
    official_address: Optional[str] = None
    official_phone: Optional[str] = None
    official_website: Optional[str] = None
    office_name: Optional[str] = None

class StockTradeItem(BaseModel):
    ticker: str
    asset_name: str
    transaction_type: str  # "PURCHASE", "SALE", "EXCHANGE"
    transaction_date: str
    disclosure_date: str
    amount_range: str      # e.g. "$1,001 - $15,000"
    owner: str             # "Self", "Spouse", "Joint"

class PartyAlignmentStats(BaseModel):
    party_line_vote_pct: float
    missed_votes_pct: float
    total_votes_eligible: int
    total_votes_cast: int

class DistrictDemographics(BaseModel):
    district_pvi: str
    median_household_income: str
    total_population: str
    top_industries: List[str] = []

class NewsArticleItem(BaseModel):
    title: str
    source: str
    publication_date: str
    url: str
    snippet: Optional[str] = None

class TermHistoryItem(BaseModel):
    chamber: Chamber
    title: str
    state: str
    district: Optional[int] = None
    start_year: str
    end_year: str
    party: Optional[Party] = None
    how: Optional[str] = None
    is_current: bool = False

class PoliticianDetail(PoliticianBase):
    chamber: Chamber
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    twitter_account: Optional[str] = None
    facebook_account: Optional[str] = None
    youtube_account: Optional[str] = None
    website_url: Optional[str] = None
    next_election: Optional[str] = None
    bio_summary: Optional[str] = None
    wikipedia_id: Optional[str] = None
    stances: List[str] = []
    policy_stances: List[PolicyStanceItem] = []
    sponsored_legislation: List[SponsoredLegislationItem] = []
    voted_legislation: List[VotedLegislationItem] = []
    electoral_history: List[ElectoralHistoryItem] = []
    civic_contact_info: Optional[CivicContactInfo] = None
    stock_trades: List[StockTradeItem] = []
    party_alignment: Optional[PartyAlignmentStats] = None
    district_demographics: Optional[DistrictDemographics] = None
    news_feed: List[NewsArticleItem] = []
    affiliations: List[str] = []
    controversies: List[str] = []
    fec_id: Optional[str] = None
    fec_ids: List[str] = []
    terms_history: List[TermHistoryItem] = []
    career_chambers: List[str] = []
    has_multi_chamber_history: bool = False
# endregion
