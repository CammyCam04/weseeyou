# region Imports
from typing import List, Optional
from pydantic import BaseModel
# endregion

# region Models
class ContributorItem(BaseModel):
    name: str
    amount: float

class DonorItem(BaseModel):
    name: str
    amount: float
    contributors: List[ContributorItem] = []

class PacItem(BaseModel):
    name: str
    type: str  # "PAC", "Super PAC", "Joint Fundraising Committee", "Leadership PAC"
    amount: float
    percentage: float = 0.0
    date: Optional[str] = None

class IndustrySectorItem(BaseModel):
    sector_name: str
    amount: float
    percentage: float

class IndependentExpenditureItem(BaseModel):
    committee_name: str
    support_or_oppose: str  # "SUPPORT" or "OPPOSE"
    amount: float
    description: Optional[str] = None

class TopDonorItem(BaseModel):
    name: str
    total_amount: float
    individual_amount: float = 0.0
    pac_amount: float = 0.0

class FinanceHistoryItem(BaseModel):
    cycle: str
    small_donations: float
    pac_donations: float
    super_pac_donations: float

class FinanceSummary(BaseModel):
    id: str
    candidate_id: str
    office: str
    state: str
    total_donations: float
    small_donations_pct: float
    pac_donations_pct: float
    super_pac_donations_pct: float
    history: List[FinanceHistoryItem]
    donors: List[DonorItem] = []
    top_donors: List[TopDonorItem] = []
    pacs: List[PacItem] = []
    super_pacs: List[PacItem] = []
    industry_sectors: List[IndustrySectorItem] = []
    independent_expenditures: List[IndependentExpenditureItem] = []
# endregion
