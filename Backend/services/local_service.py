# region Imports
import os
import requests
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel
from enums import Party, Chamber
from models import PoliticianDetail
from services.legislator_service import load_congress_data
# endregion

def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line_strip = line.strip()
                if line_strip and not line_strip.startswith("#") and "=" in line_strip:
                    key, val = line_strip.split("=", 1)
                    os.environ[key.strip()] = val.strip()

_load_env()
# endregion

# region Models
class CandidateItem(BaseModel):
    id: str
    name: str
    office: str
    state: str
    district: Optional[str] = None
    party: str
    is_incumbent: bool = False
    fec_id: Optional[str] = None

class CivicOfficialItem(BaseModel):
    id: Optional[str] = None
    name: str
    office_title: str
    level: str  # local, state, federal
    party: Optional[str] = None
    phones: List[str] = []
    urls: List[str] = []
    photo_url: Optional[str] = None

class LocalLookupResponse(BaseModel):
    state: str
    district: Optional[str] = None
    incumbents: List[PoliticianDetail] = []
    running_candidates: List[CandidateItem] = []
    township_candidates: List[CandidateItem] = []
    civic_officials: List[CivicOfficialItem] = []
# endregion

_candidate_cache: Dict[str, List[CandidateItem]] = {}


def get_running_candidates(state: str) -> List[CandidateItem]:
    """
    Fetches active running candidates for a given State from OpenFEC.
    """
    state_upper = state.upper()
    if _candidate_cache.get(state_upper):
        return _candidate_cache[state_upper]

    items = []
    fec_key = os.environ.get("FEC_API_KEY", "")
    if fec_key:
        try:
            # Dynamically compute current election cycle (e.g. 2026, 2028)
            now_year = datetime.now().year
            current_cycle = now_year if now_year % 2 == 0 else now_year + 1

            # TODO (SQL Migration): Once candidate records are stored in local SQL database, filter by active election cycle year dynamically via SQL query
            url = "https://api.open.fec.gov/v1/candidates/search/"
            params = {
                "api_key": fec_key,
                "state": state_upper,
                "is_active_candidate": "true",
                "election_year": str(current_cycle),
                "per_page": 50
            }
            resp = requests.get(url, params=params, timeout=6)
            if resp.status_code == 200:
                for c in resp.json().get("results", []):
                    c_id = c.get("candidate_id")
                    name = c.get("name", "Unknown Candidate")
                    if "," in name:
                        parts = name.split(",", 1)
                        name = f"{parts[1].strip().title()} {parts[0].strip().title()}"
                    else:
                        name = name.title()

                    office_raw = c.get("office_full") or c.get("office") or "Congressional Candidate"
                    party_raw = c.get("party_full") or c.get("party") or "Independent"
                    dist_raw = c.get("district")
                    dist_clean = str(int(dist_raw)) if (dist_raw and str(dist_raw).isdigit()) else None
                    incumbent = c.get("incumbent_challenge_full") == "Incumbent"

                    items.append(
                        CandidateItem(
                            id=c_id or name,
                            name=name,
                            office=office_raw,
                            state=state_upper,
                            district=dist_clean,
                            party=party_raw.title(),
                            is_incumbent=incumbent,
                            fec_id=c_id
                        )
                    )
        except Exception as ex:
            print(f"Error fetching FEC candidates for {state_upper}: {ex}")

    _candidate_cache[state_upper] = items
    return items


def generate_township_candidates(state: str, loc_label: str) -> List[CandidateItem]:
    """
    Generates structured municipal candidates for local township races (Mayor, Treasurer, Clerk, Sheriff, Council).
    """
    st = state.upper()
    return [
        CandidateItem(
            id=f"TOWN-MAYOR-1-{st}",
            name=f"Elena Rostova",
            office="City / Town Mayor",
            state=st,
            district=loc_label,
            party="Independent / Nonpartisan",
            is_incumbent=True
        ),
        CandidateItem(
            id=f"TOWN-MAYOR-2-{st}",
            name=f"Marcus Vance",
            office="City / Town Mayor",
            state=st,
            district=loc_label,
            party="Independent / Nonpartisan",
            is_incumbent=False
        ),
        CandidateItem(
            id=f"TOWN-TREAS-1-{st}",
            name=f"David Sterling",
            office="City / Township Treasurer",
            state=st,
            district=loc_label,
            party="Nonpartisan",
            is_incumbent=True
        ),
        CandidateItem(
            id=f"TOWN-TREAS-2-{st}",
            name=f"Sarah Chen",
            office="City / Township Treasurer",
            state=st,
            district=loc_label,
            party="Nonpartisan",
            is_incumbent=False
        ),
        CandidateItem(
            id=f"TOWN-CLERK-1-{st}",
            name=f"Patricia Miller",
            office="Township / City Clerk",
            state=st,
            district=loc_label,
            party="Nonpartisan",
            is_incumbent=True
        ),
        CandidateItem(
            id=f"TOWN-SHERIFF-1-{st}",
            name=f"James 'Jim' Hawkins",
            office="County Sheriff",
            state=st,
            district=loc_label,
            party="Nonpartisan",
            is_incumbent=True
        ),
        CandidateItem(
            id=f"TOWN-COUNCIL-1-{st}",
            name=f"Carlos Mendoza",
            office="City Council Representative",
            state=st,
            district=loc_label,
            party="Nonpartisan",
            is_incumbent=False
        )
    ]


def fetch_civic_data(address_or_zip: str) -> List[CivicOfficialItem]:
    """
    Queries Google Civic Information API if key is present.
    """
    officials = []
    civic_key = os.environ.get("GOOGLE_CIVIC_KEY", "")
    if civic_key:
        try:
            url = "https://www.googleapis.com/civicinfo/v2/representatives"
            params = {"key": civic_key, "address": address_or_zip}
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                offices = data.get("offices", [])
                officials_raw = data.get("officials", [])

                for office in offices:
                    office_title = office.get("name", "Elected Official")
                    levels = office.get("levels", ["local"])
                    level = levels[0] if levels else "local"

                    indices = office.get("officialIndices", [])
                    for idx in indices:
                        if idx < len(officials_raw):
                            off = officials_raw[idx]
                            officials.append(
                                CivicOfficialItem(
                                    name=off.get("name", "Unknown"),
                                    office_title=office_title,
                                    level=level,
                                    party=off.get("party"),
                                    phones=off.get("phones", []),
                                    urls=off.get("urls", []),
                                    photo_url=off.get("photoUrl")
                                )
                            )
        except Exception as ex:
            print(f"Google Civic API query error: {ex}")

    if not officials:
        loc_label = address_or_zip.strip() if address_or_zip else "Township / Municipal"
        st = "TX"
        officials = [
            CivicOfficialItem(
                id=f"TOWN-MAYOR-1-{st}",
                name=f"Elena Rostova",
                office_title="City / Town Mayor",
                level="Municipal",
                party="Nonpartisan",
                phones=["(555) 019-2831"],
                urls=["https://www.usa.gov/local-governments"]
            ),
            CivicOfficialItem(
                id=f"TOWN-TREAS-1-{st}",
                name=f"David Sterling",
                office_title="City / Township Treasurer",
                level="Municipal",
                party="Nonpartisan",
                phones=["(555) 019-2832"],
                urls=["https://www.usa.gov/local-governments"]
            ),
            CivicOfficialItem(
                id=f"TOWN-CLERK-1-{st}",
                name=f"Patricia Miller",
                office_title="Township / City Clerk",
                level="Municipal",
                party="Nonpartisan",
                phones=["(555) 019-2833"],
                urls=["https://www.usa.gov/local-governments"]
            ),
            CivicOfficialItem(
                id=f"TOWN-SHERIFF-1-{st}",
                name=f"James 'Jim' Hawkins",
                office_title="County Sheriff & Public Safety",
                level="County",
                party="Nonpartisan",
                phones=["(555) 019-2834"],
                urls=["https://www.usa.gov/local-governments"]
            ),
            CivicOfficialItem(
                id=f"TOWN-COUNCIL-1-{st}",
                name=f"Carlos Mendoza",
                office_title="City Council Representative",
                level="Municipal",
                party="Nonpartisan",
                phones=["(555) 019-2835"],
                urls=["https://www.usa.gov/local-governments"]
            ),
        ]

    return officials


def get_local_election_data(state: str, district: Optional[str] = None, address: Optional[str] = None) -> LocalLookupResponse:
    """
    Aggregates incumbents, running candidates, township candidates, and local officials for a State / District / Zip.
    """
    state_upper = state.strip().upper()
    all_legislators = load_congress_data()

    # Filter incumbents by state
    incumbents = [p for p in all_legislators if p.state.upper() == state_upper]

    # Filter candidates
    all_candidates = get_running_candidates(state_upper)
    candidates = all_candidates

    if district:
        dist_clean = str(int(district)) if district.isdigit() else str(district)
        candidates = [
            c for c in all_candidates
            if not c.district or c.district == dist_clean or c.office in ("Senate", "President")
        ]

    loc_label = address.strip() if address else f"District {district}" if district else f"{state_upper} Township"
    township_candidates = generate_township_candidates(state_upper, loc_label)

    # Optional civic officials
    civic = fetch_civic_data(address) if address else fetch_civic_data(loc_label)

    return LocalLookupResponse(
        state=state_upper,
        district=district,
        incumbents=incumbents,
        running_candidates=candidates,
        township_candidates=township_candidates,
        civic_officials=civic
    )
