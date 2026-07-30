# region Imports
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Optional, Tuple
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

STATE_NAME_LOOKUP = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New_York", "NC": "North_Carolina", "ND": "North_Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South_Carolina",
    "SD": "South_Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West_Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District_of_Columbia"
}


def get_running_candidates(state: str) -> List[CandidateItem]:
    """
    Fetches active running candidates for a given State dynamically from OpenFEC API.
    """
    state_upper = state.upper()
    if _candidate_cache.get(state_upper):
        return _candidate_cache[state_upper]

    items = []
    fec_key = os.environ.get("FEC_API_KEY", "DEMO_KEY")
    try:
        now_year = datetime.now().year
        current_cycle = now_year if now_year % 2 == 0 else now_year + 1

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


def fetch_dynamic_township_officials(city_name: str, state_code: str) -> List[CandidateItem]:
    """
    Dynamically fetches active municipal & county officials (Mayor, City Council, Sheriff, Executive)
    for a given city and state via public Wikipedia REST API, separating each council member into their own profile.
    Zero hardcoding.
    """
    officials: List[CandidateItem] = []
    headers = {"User-Agent": "WeSeeYouCivicApp/1.0 (contact@weseeyou.org)"}
    
    st_upper = state_code.upper()
    full_state = STATE_NAME_LOOKUP.get(st_upper, st_upper)
    clean_city = city_name.replace(" ", "_")
    page_title = f"{clean_city},_{full_state}"
    
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=parse&page={page_title}&prop=text&format=json"
        res = requests.get(url, headers=headers, timeout=5).json()
        html = res.get("parse", {}).get("text", {}).get("*", "")
        soup = BeautifulSoup(html, "html.parser")
        
        infobox = soup.find("table", {"class": "infobox"})
        if infobox:
            parsed_count = 1
            for row in infobox.find_all("tr"):
                text = row.get_text(strip=True)
                if any(w in text for w in ["Mayor", "Executive", "Leader", "Sheriff", "Clerk", "Council", "Judge", "Commissioner", "Representative"]):
                    cols = row.find_all(["td", "th"])
                    if len(cols) >= 2:
                        title_raw = cols[0].get_text(strip=True).replace("•", "").strip()
                        if "Type" in title_raw or "Body" in title_raw:
                            continue
                            
                        val_td = cols[1]
                        names = []
                        links = val_td.find_all("a")
                        if links:
                            for a in links:
                                t = a.get_text(strip=True)
                                if len(t) > 2 and not t.startswith("[") and not "Wikipedia" in t:
                                    names.append(t)
                                    
                        if not names:
                            raw_str = val_td.get_text(separator="|", strip=True)
                            names = [p.split("[")[0].strip() for p in raw_str.split("|") if len(p.strip()) > 2 and not p.startswith("[")]
                            
                        office_title = "City Councilmember" if "Council" in title_raw else title_raw
                        
                        for name_item in names:
                            if name_item and len(name_item) > 2:
                                safe_name = name_item.replace(" ", "_")
                                officials.append(
                                    CandidateItem(
                                        id=f"TOWN-{st_upper}-{parsed_count:02d}_{safe_name}",
                                        name=name_item,
                                        office=f"{office_title} ({city_name})",
                                        state=st_upper,
                                        district=city_name,
                                        party="Independent / Nonpartisan",
                                        is_incumbent=True
                                    )
                                )
                                parsed_count += 1
    except Exception as ex:
        print(f"Error fetching dynamic township data for {page_title}: {ex}")
        
    return officials


def fetch_civic_data(address_or_zip: str) -> List[CivicOfficialItem]:
    """
    Queries Google Civic Information API dynamically for real local, county, and state representatives.
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

    return officials


def _resolve_zip_to_city_details(addr_or_zip: str, default_state: str) -> Tuple[str, str, str]:
    """
    Converts 5-digit U.S. ZIP code (e.g. 40165) into official (City, StateCode, DisplayLabel)
    e.g. ("Shepherdsville", "KY", "Shepherdsville, KY").
    """
    cleaned = addr_or_zip.strip()
    if cleaned.isdigit() and len(cleaned) == 5:
        try:
            res = requests.get(f"http://api.zippopotam.us/us/{cleaned}", timeout=3)
            if res.status_code == 200:
                data = res.json()
                places = data.get("places", [])
                if places:
                    place = places[0]
                    city = place.get("place name")
                    st = place.get("state abbreviation")
                    return city, st, f"{city}, {st}"
        except Exception:
            pass
    return cleaned, default_state.upper(), cleaned


def get_local_election_data(state: str, district: Optional[str] = None, address: Optional[str] = None) -> LocalLookupResponse:
    """
    Aggregates incumbents, running candidates, township candidates, and local officials dynamically for a State / District / Zip.
    Zero hardcoded mock names.
    """
    state_upper = state.strip().upper()
    all_legislators = load_congress_data()

    # Filter incumbents by state
    incumbents = [p for p in all_legislators if p.state.upper() == state_upper]

    # Filter candidates dynamically from FEC
    all_candidates = get_running_candidates(state_upper)
    candidates = all_candidates

    if district:
        dist_clean = str(int(district)) if district.isdigit() else str(district)
        candidates = [
            c for c in all_candidates
            if not c.district or c.district == dist_clean or c.office in ("Senate", "President")
        ]

    # Resolve city and state details from ZIP/address
    city_name, resolved_state, city_town_label = _resolve_zip_to_city_details(address, state_upper) if address else (state_upper, state_upper, f"{state_upper} Region")

    # Fetch dynamic municipal/township candidates (separated by individual candidate profile)
    township_candidates = []
    if address:
        township_candidates = fetch_dynamic_township_officials(city_name, resolved_state)

    # Dynamic civic officials query
    civic = fetch_civic_data(address) if address else fetch_civic_data(city_town_label)

    return LocalLookupResponse(
        state=resolved_state or state_upper,
        district=district,
        incumbents=incumbents,
        running_candidates=candidates,
        township_candidates=township_candidates,
        civic_officials=civic
    )
