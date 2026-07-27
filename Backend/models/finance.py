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
    pacs: List[PacItem] = []
    super_pacs: List[PacItem] = []
# endregion
