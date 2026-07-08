# region Imports
from typing import List
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
# endregion
