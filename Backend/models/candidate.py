# region Imports
from typing import List, Optional, Dict
from pydantic import BaseModel
from models.finance import FinanceSummary
from models.politician import SponsoredLegislationItem
# endregion

# region Models
class PolicyStanceItem(BaseModel):
    category: str
    position: str
    details: str

class CandidateDetailResponse(BaseModel):
    id: str
    name: str
    office: str
    state: str
    district: Optional[str] = None
    party: str
    is_incumbent: bool = False
    fec_id: Optional[str] = None
    election_year: str = "2026"
    bio_summary: Optional[str] = None
    contact_email: Optional[str] = None
    website_url: Optional[str] = None
    total_spent: float = 0.0
    cash_on_hand: float = 0.0
    debts_owed: float = 0.0
    policy_stances: List[PolicyStanceItem] = []
    endorsements: List[str] = []
    finance: Optional[FinanceSummary] = None
    sponsored_bills: List[SponsoredLegislationItem] = []
# endregion
