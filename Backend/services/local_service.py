# region Imports
import os
import re
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

class CountyOfficialItem(BaseModel):
    id: str
    name: str
    office: str
    county: str
    state: str
    party: Optional[str] = "Elected Official"
    is_incumbent: bool = True
    phone: Optional[str] = None
    url: Optional[str] = None

class LocalLookupResponse(BaseModel):
    state: str
    county: Optional[str] = None
    district: Optional[str] = None
    incumbents: List[PoliticianDetail] = []
    running_candidates: List[CandidateItem] = []
    county_officials: List[CountyOfficialItem] = []
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
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia"
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


_wiki_session = requests.Session()
_wiki_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
_wiki_cache: Dict[str, Optional[BeautifulSoup]] = {}

def _fetch_wiki_soup(page_title: str) -> Optional[BeautifulSoup]:
    """
    Safely fetches and parses Wikipedia HTML parse trees using query params, persistent session, and caching.
    """
    if page_title in _wiki_cache:
        return _wiki_cache[page_title]
        
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "parse",
        "page": page_title,
        "redirects": "1",
        "prop": "text",
        "format": "json"
    }
    
    try:
        res = _wiki_session.get(url, params=params, timeout=5)
        if res.status_code == 200 and res.text.strip():
            j = res.json()
            if "parse" in j:
                html = j["parse"].get("text", {}).get("*", "")
                if html:
                    soup = BeautifulSoup(html, "html.parser")
                    _wiki_cache[page_title] = soup
                    return soup
    except Exception as ex:
        print(f"Error fetching wiki parse for {page_title}: {ex}")
        
    return None


_county_list_cache: Dict[str, List[str]] = {}

def get_state_counties(state_code: str) -> List[str]:
    """
    Dynamically fetches all official Counties/Parishes for a U.S. State from public parse trees.
    """
    st_upper = state_code.strip().upper()
    if st_upper in _county_list_cache:
        return _county_list_cache[st_upper]
        
    full_state = STATE_NAME_LOOKUP.get(st_upper, st_upper)
    st_clean = full_state.replace(" ", "_")
    page_title = f"List_of_counties_in_{st_clean}"
    
    counties = []
    soup = _fetch_wiki_soup(page_title)
    if soup:
        for tbl in soup.find_all("table", {"class": "wikitable"}):
            for tr in tbl.find_all("tr")[1:]:
                cols = tr.find_all(["td", "th"])
                if cols:
                    for c in cols[:2]:
                        a_link = c.find("a")
                        if a_link:
                            t = a_link.get_text(strip=True)
                            if "County" in t or "Parish" in t or "Borough" in t:
                                if t not in counties and not any(b in t for b in ["List", "Category", "Map"]):
                                    counties.append(t)
                                    break
    sorted_counties = sorted(counties)
    _county_list_cache[st_upper] = sorted_counties
    return sorted_counties


def _discover_county_cities(county_name: str, full_state: str, headers: dict) -> List[str]:
    """
    Dynamically discovers all incorporated cities within a given county from public parse trees.
    """
    clean_county = county_name.replace(" ", "_")
    if not clean_county.endswith("County") and not clean_county.endswith("Parish"):
        clean_county += "_County"
    st_clean = full_state.replace(" ", "_")
    page_title = f"{clean_county},_{st_clean}"
    cities = []
    
    soup = _fetch_wiki_soup(page_title)
    if soup:
        for nav in soup.find_all("table", {"class": "navbox-inner"}):
            for tr in nav.find_all("tr"):
                text = tr.get_text()
                if "Cities" in text:
                    for a in tr.find_all("a"):
                        t = a.get_text(strip=True)
                        if t and t != "Cities" and len(t) > 2 and t not in cities:
                            cities.append(t)
    return cities


def _clean_person_name(name_str: str) -> str:
    """
    Cleans Wikipedia artifacts ([1], [citation needed], bullets) from person names.
    """
    if not name_str:
        return ""
    n = re.sub(r"\[.*?\]", "", name_str)
    n = n.replace("citation needed", "").replace("•", "").strip()
    n = re.sub(r"\s+", " ", n)
    return n


def _fetch_detailed_council_members(city_name: str, full_state: str, val_td=None) -> List[Tuple[str, str, str]]:
    """
    Dynamically fetches individual councilmembers (Name, Office, Party) from dedicated City/Metro Council Wikipedia pages.
    """
    candidates_to_try = []
    if val_td:
        for a in val_td.find_all("a"):
            href = a.get("href", "")
            if "/wiki/" in href:
                title = href.split("/wiki/")[-1]
                if any(kw in title for kw in ["Council", "Aldermen", "Commission", "Board"]):
                    candidates_to_try.append(title)

    clean_c = city_name.replace(" ", "_")
    for suffix in ["_City_Council", "_Metro_Council", "_Board_of_Aldermen", "_Common_Council", "_City_Commission"]:
        cand = f"{clean_c}{suffix}"
        if cand not in candidates_to_try:
            candidates_to_try.append(cand)

    members = []
    seen = set()
    for page_title in candidates_to_try:
        soup = _fetch_wiki_soup(page_title)
        if not soup:
            continue
        for tbl in soup.find_all("table", {"class": "wikitable"}):
            for tr in tbl.find_all("tr"):
                cols = tr.find_all(["td", "th"])
                if len(cols) >= 2:
                    c0 = _clean_person_name(cols[0].get_text(strip=True))
                    if any(kw in c0 for kw in ["District", "Ward", "Post", "Seat"]) or c0.isdigit():
                        dist_lbl = f"District {c0}" if c0.isdigit() else c0
                        a_links = cols[1].find_all("a")
                        names_raw = [a.get_text(strip=True) for a in a_links if len(a.get_text(strip=True)) > 2]
                        if not names_raw:
                            raw_t = _clean_person_name(cols[1].get_text(strip=True).split("(")[0])
                            if "," in raw_t:
                                names_raw = [p.strip() for p in raw_t.split(",")]
                            elif len(raw_t) > 2:
                                names_raw = [raw_t]
                        
                        raw_tr = tr.get_text()
                        party = "Democrat" if "Democrat" in raw_tr else "Republican" if "Republican" in raw_tr else "Independent / Nonpartisan"
                        for n in names_raw:
                            clean_n = _clean_person_name(n)
                            if clean_n and len(clean_n) > 2 and clean_n.lower() not in seen and not any(b in clean_n for b in ["District", "Party", "Vacant", "Member", "Name", "Ward", "Seat"]):
                                seen.add(clean_n.lower())
                                members.append((clean_n, f"City Councilmember ({city_name} - {dist_lbl})", party))
        if members:
            break
    return members


def fetch_dynamic_township_officials(city_name: str, state_code: str, county_name: Optional[str] = None) -> List[CandidateItem]:
    """
    Dynamically fetches active municipal officials (Mayor of City, City Council, Aldermen, City Commissioners)
    for a given city and all incorporated cities within the county via public parse trees & county portals,
    attaching their exact specific city name to each office profile. Zero hardcoding.
    """
    officials: List[CandidateItem] = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    st_upper = state_code.upper()
    full_state = STATE_NAME_LOOKUP.get(st_upper, st_upper)
    
    cities_to_fetch = [city_name] if city_name else []
    if county_name:
        discovered = _discover_county_cities(county_name, full_state, headers)
        for c in discovered:
            if c and c not in cities_to_fetch:
                cities_to_fetch.append(c)

    parsed_count = 1
    seen_names = set()

    # 1. Fetch from individual city Wikipedia pages
    for current_city in cities_to_fetch[:8]:
        clean_city = current_city.replace(" ", "_")
        
        soup = _fetch_wiki_soup(f"{clean_city},_{full_state}")
        if not soup:
            soup = _fetch_wiki_soup(clean_city)

        if not soup:
            continue

        infobox = soup.find("table", {"class": "infobox"})
        if infobox:
            for tr in infobox.find_all("tr"):
                cols = tr.find_all(["th", "td"])
                if len(cols) >= 2:
                    lbl = cols[0].get_text().replace("\xa0", " ").replace("•", "").strip()
                    val_td = cols[1]
                    if any(kw in lbl for kw in ["Mayor", "Executive", "Leader", "Council", "Manager", "Governor", "Commissioner", "Alderman"]):
                        if any(bad in lbl for bad in ["Type", "Body", "National", "Landmark", "Seat", "Area"]):
                            continue

                        if "Council" in lbl or "Alderman" in lbl or "Board" in lbl:
                            detailed = _fetch_detailed_council_members(current_city, full_state, val_td)
                            if detailed:
                                for c_name, c_office, c_party in detailed:
                                    clean_c_name = _clean_person_name(c_name)
                                    if clean_c_name and clean_c_name.lower() not in seen_names:
                                        seen_names.add(clean_c_name.lower())
                                        safe_name = clean_c_name.replace(" ", "_")
                                        officials.append(
                                            CandidateItem(
                                                id=f"TOWN-{st_upper}-{parsed_count:02d}_{safe_name}",
                                                name=clean_c_name,
                                                office=c_office,
                                                state=st_upper,
                                                district=current_city,
                                                party=c_party,
                                                is_incumbent=True
                                            )
                                        )
                                        parsed_count += 1
                                continue

                        names = [a.get_text(strip=True) for a in val_td.find_all("a") if len(a.get_text(strip=True)) > 2]
                        if not names:
                            raw_v = val_td.get_text(strip=True).split("(")[0].split("[")[0].strip()
                            if "," in raw_v:
                                names = [p.strip() for p in raw_v.split(",")]
                            elif len(raw_v) > 2:
                                names = [raw_v]
                                
                        is_m = "Mayor" in lbl
                        office_title = f"Mayor of {current_city}" if is_m else f"City Councilmember ({current_city})" if "Council" in lbl else f"{lbl} ({current_city})"
                        for n in names:
                            clean_n = _clean_person_name(n)
                            if clean_n and len(clean_n) > 2 and clean_n.lower() not in seen_names and not any(bad in clean_n for bad in ["Wikipedia", "List", "Government", "Council"]):
                                seen_names.add(clean_n.lower())
                                safe_name = clean_n.replace(" ", "_")
                                officials.append(
                                    CandidateItem(
                                        id=f"TOWN-{st_upper}-{parsed_count:02d}_{safe_name}",
                                        name=clean_n,
                                        office=office_title,
                                        state=st_upper,
                                        district=current_city,
                                        party="Independent / Nonpartisan",
                                        is_incumbent=True
                                    )
                                )
                                parsed_count += 1

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


def _resolve_zip_to_location_details(addr_or_zip: str, default_state: str) -> Tuple[str, Optional[str], str, str]:
    """
    Resolves ZIP or address into (city_name, county_name, state_code, display_label)
    e.g. ("CityName", "CountyName", "StateCode", "DisplayLabel")
    """
    cleaned = addr_or_zip.strip()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    city = None
    county = None
    st_code = default_state.upper()

    # Clean input e.g. "Louisville, KY" -> city_term="Louisville", state_term="KY"
    city_term = cleaned
    if "," in cleaned:
        parts = cleaned.split(",", 1)
        city_term = parts[0].strip()
        st_candidate = parts[1].strip().upper()
        if len(st_candidate) == 2:
            st_code = st_candidate
        elif st_candidate in STATE_NAME_LOOKUP.values():
            for code, name in STATE_NAME_LOOKUP.items():
                if name.upper() == st_candidate:
                    st_code = code
                    break

    full_state = STATE_NAME_LOOKUP.get(st_code, st_code)

    # 1. Try Nominatim OpenStreetMap for precise County + City lookup
    try:
        if city_term.isdigit() and len(city_term) == 5:
            nom_url = f"https://nominatim.openstreetmap.org/search?postalcode={city_term}&country=US&format=json&addressdetails=1"
        else:
            nom_url = f"https://nominatim.openstreetmap.org/search?city={city_term}&state={st_code}&country=US&format=json&addressdetails=1"
            
        res = requests.get(nom_url, headers=headers, timeout=4)
        if res.status_code == 200:
            items = res.json()
            if items:
                addr = items[0].get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("suburb") or None
                county = addr.get("county") or None
                st_iso = addr.get("ISO3166-2-lvl4", "")
                if "-" in st_iso:
                    st_code = st_iso.split("-")[-1].upper()
                    full_state = STATE_NAME_LOOKUP.get(st_code, st_code)
    except Exception as ex:
        print(f"Nominatim lookup exception: {ex}")

    # 2. Fallback to Zippopotam for missing city or state if 5-digit ZIP
    if (not city or not county) and city_term.isdigit() and len(city_term) == 5:
        try:
            res = requests.get(f"http://api.zippopotam.us/us/{city_term}", timeout=3)
            if res.status_code == 200:
                data = res.json()
                places = data.get("places", [])
                if places:
                    place = places[0]
                    if not city:
                        city = place.get("place name")
                    if not st_code:
                        st_code = place.get("state abbreviation", default_state.upper())
                        full_state = STATE_NAME_LOOKUP.get(st_code, st_code)
        except Exception:
            pass

    if not city or city.isdigit():
        city = city_term

    # 3. Dynamic Fallback for missing County (e.g. for Consolidated City-Counties like Louisville, Chicago, Houston, Phoenix)
    if (not county or county == "County") and city and not city.isdigit():
        try:
            clean_city_str = city.replace(" ", "_")
            soup = _fetch_wiki_soup(f"{clean_city_str},_{full_state}") or _fetch_wiki_soup(clean_city_str)
            if soup:
                infobox = soup.find("table", {"class": "infobox"})
                if infobox:
                    for tr in infobox.find_all("tr"):
                        t = tr.get_text()
                        if "County" in t or "Counties" in t or "Parish" in t:
                            for a in tr.find_all("a"):
                                txt = a.get_text(strip=True)
                                if len(txt) > 2 and txt not in ["State", "U.S.", "USA", "List"]:
                                    county = txt if ("County" in txt or "Parish" in txt) else f"{txt} County"
                                    break
                            if county:
                                break
        except Exception as ex:
            print(f"Fallback county lookup error: {ex}")

    display_parts = [p for p in [city, county, st_code] if p]
    display = ", ".join(display_parts)
    return city, county, st_code, display


def fetch_dynamic_county_officials(county_name: str, state_code: str) -> List[CountyOfficialItem]:
    """
    Dynamically fetches County-wide Officials (County Judge-Executive, Circuit Court Clerk, County Clerk,
    County Attorney, Commonwealth's Attorney, Sheriff, Jailer, Coroner, PVA, Magistrates, Constables, School Board)
    for a given county using live Wikipedia parse trees, open civic API, and official county government directory portals.
    Excludes municipal mayors/councilmembers which are handled by fetch_dynamic_township_officials.
    """
    officials: List[CountyOfficialItem] = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    st_upper = state_code.upper()
    full_state = STATE_NAME_LOOKUP.get(st_upper, st_upper)
    
    clean_county = county_name.replace(" ", "_")
    if not clean_county.endswith("County") and not clean_county.endswith("Parish"):
        clean_county += "_County"
        
    page_title = f"{clean_county},_{full_state}"
    
    site_url = None
    parsed_count = 1
    seen_names = set()

    # 1. Parse Wikipedia Page & Discover Official County Website
    try:
        soup = _fetch_wiki_soup(page_title)
        if soup:
            # Discover website
            infobox = soup.find("table", {"class": "infobox"})
            if infobox:
                for tr in infobox.find_all("tr"):
                    t = tr.get_text()
                    if "Website" in t or "Official site" in t:
                        for a in tr.find_all("a"):
                            h = a.get("href", "")
                            if h.startswith("http"):
                                site_url = h
                                break

                    # Parse Infobox for Executive, Sheriff, Attorney, Clerk, Coroner, Magistrates (excluding Mayor)
                    if any(w in t for w in ["Judge", "Executive", "Sheriff", "Attorney", "Clerk", "Coroner", "Commission", "Board", "Magistrate", "Jailer", "Prosecutor", "Chair", "Chairman", "Manager"]) and not "Mayor" in t:
                        cols = tr.find_all(["td", "th"])
                        if len(cols) >= 2:
                            title_raw = _clean_person_name(cols[0].get_text(strip=True))
                            if any(bad in title_raw for bad in ["Type", "Body", "Seat", "Area"]):
                                continue
                                
                            val_td = cols[1]
                            names = [a.get_text(strip=True) for a in val_td.find_all("a") if len(a.get_text(strip=True)) > 2 and not a.get_text(strip=True).startswith("[")]
                            if not names:
                                raw_str = val_td.get_text(separator="|", strip=True)
                                if "," in raw_str:
                                    names = [p.strip() for p in raw_str.split(",")]
                                else:
                                    names = [p.split("[")[0].strip() for p in raw_str.split("|") if len(p.strip()) > 2 and not p.startswith("[")]
                                
                            for name_item in names:
                                clean_n = _clean_person_name(name_item)
                                if clean_n and len(clean_n) > 2 and clean_n.lower() not in seen_names and not any(bad in clean_n for bad in ["Wikipedia", "List", "Government"]):
                                    seen_names.add(clean_n.lower())
                                    safe_name = clean_n.replace(" ", "_")
                                    officials.append(
                                        CountyOfficialItem(
                                            id=f"COUNTY-{st_upper}-{parsed_count:02d}_{safe_name}",
                                            name=clean_n,
                                            office=f"{title_raw} ({county_name})",
                                            county=county_name,
                                            state=st_upper,
                                            party="Elected Official",
                                            is_incumbent=True
                                        )
                                    )
                                    parsed_count += 1

            # Parse Elected Officials tables on Wikipedia page (excluding Mayor)
            for tbl in soup.find_all("table", {"class": "wikitable"}):
                for tr in tbl.find_all("tr")[1:]:
                    cols = tr.find_all(["td", "th"])
                    if len(cols) >= 2:
                        row_txt = tr.get_text(strip=True)
                        if any(w in row_txt for w in ["U.S. House", "Senate", "House", "Sheriff", "Judge", "Attorney", "Clerk", "Coroner", "Magistrate", "Commissioner"]) and not "Mayor" in row_txt:
                            office_cell = cols[0].get_text(strip=True)
                            name_cell = cols[1].get_text(strip=True)
                            party_cell = cols[2].get_text(strip=True) if len(cols) > 2 else "Elected Official"
                            
                            clean_n = name_cell.split("(")[0].strip()
                            if clean_n and len(clean_n) > 2 and clean_n.lower() not in seen_names and not clean_n.startswith("["):
                                seen_names.add(clean_n.lower())
                                safe_name = clean_n.replace(" ", "_")
                                p_title = "Republican" if "(R)" in party_cell or party_cell == "R" else "Democrat" if "(D)" in party_cell or party_cell == "D" else "Elected Official"
                                officials.append(
                                    CountyOfficialItem(
                                        id=f"COUNTY-{st_upper}-{parsed_count:02d}_{safe_name}",
                                        name=clean_n,
                                        office=f"{office_cell} ({county_name})",
                                        county=county_name,
                                        state=st_upper,
                                        party=p_title,
                                        is_incumbent=True
                                    )
                                )
                                parsed_count += 1
    except Exception as ex:
        print(f"Error fetching Wikipedia county data: {ex}")

    # 2. Scrape Official County Government Directory Portal for County-Wide Titles (excluding Mayor)
    if site_url:
        try:
            clean_site = site_url.rstrip("/")
            target_url = None
            search_res = requests.get(f"{clean_site}/?s=Elected+Officials", headers=headers, timeout=4)
            if search_res.status_code == 200:
                s_soup = BeautifulSoup(search_res.text, "html.parser")
                for a in s_soup.find_all("a"):
                    h = a.get("href", "")
                    t = a.get_text(strip=True)
                    if "Elected" in t or "Official" in t:
                        target_url = h
                        break
            if not target_url:
                target_url = f"{clean_site}/elected-officials/"

            page_res = requests.get(target_url, headers=headers, timeout=4)
            if page_res.status_code == 200:
                p_soup = BeautifulSoup(page_res.text, "html.parser")
                text_content = p_soup.get_text(separator="\n")
                lines = [l.strip() for l in text_content.split("\n") if l.strip()]

                COUNTY_TITLE_PATTERNS = [
                    "Judge Executive", "Circuit Court Clerk", "County Clerk", "County Attorney",
                    "Commonwealth Attorney", "Commonwealth's Attorney", "Sheriff", "Jailer",
                    "Coroner", "Property Valuation Administrator", "PVA", "County Surveyor",
                    "Magistrate District 1", "Magistrate District 2", "Magistrate District 3", "Magistrate District 4",
                    "Magistrate", "Constable District #1", "Constable District #2", "Constable District #3", "Constable District #4",
                    "Constable", "Board of Education"
                ]

                i = 0
                while i < len(lines):
                    line = lines[i]
                    matched_title = None
                    for t in COUNTY_TITLE_PATTERNS:
                        if t.lower() in line.lower() and not "Mayor" in line:
                            matched_title = t
                            break
                            
                    if matched_title:
                        name_found = None
                        for j in range(0, 4):
                            if i + j < len(lines):
                                candidate = lines[i + j]
                                clean_c = candidate
                                for tw in COUNTY_TITLE_PATTERNS + ["Hon.", "District 1", "District 2", "District 3", "District 4", "District 5", "District #1", "District #2", "District #3", "District #4"]:
                                    clean_c = re.sub(re.escape(tw), "", clean_c, flags=re.IGNORECASE).strip()
                                clean_c = re.sub(r"^\d+\s*", "", clean_c).strip()
                                
                                if len(clean_c) > 2 and re.match(r"^[A-Z][a-zA-Z\.\s“”-]{2,40}$", clean_c):
                                    if not any(bad in clean_c for bad in ["Phone", "P.O.", "Box", "Room", "Ste", "Street", "Road", "Drive", "Highway", "http", "gmail", "gov", "org", "com", "Meets", "Fax", "City", "Hall"]):
                                        name_found = clean_c
                                        break
                        if name_found and name_found.lower() not in seen_names:
                            seen_names.add(name_found.lower())
                            safe_name = name_found.replace(" ", "_")
                            officials.append(
                                CountyOfficialItem(
                                    id=f"COUNTY-{st_upper}-{parsed_count:02d}_{safe_name}",
                                    name=name_found,
                                    office=f"{matched_title} ({county_name})",
                                    county=county_name,
                                    state=st_upper,
                                    party="Elected Official",
                                    is_incumbent=True
                                )
                            )
                            parsed_count += 1
                    i += 1
        except Exception as ex:
            print(f"Error scraping county portal: {ex}")

    return officials


def get_local_election_data(state: str, district: Optional[str] = None, address: Optional[str] = None, county: Optional[str] = None) -> LocalLookupResponse:
    """
    Aggregates incumbents, running candidates, county officials, township candidates, and local officials dynamically for a State / District / Zip / County.
    Zero hardcoded mock names.
    """
    initial_state = state.strip().upper() if state else "KY"

    city_name = initial_state
    county_name = county.strip() if county else None
    resolved_state = initial_state
    city_town_label = f"{initial_state} Region"

    if county_name and not county_name.endswith("County") and not county_name.endswith("Parish"):
        county_name += " County"

    if address:
        c_res, co_res, st_res, lbl_res = _resolve_zip_to_location_details(address, initial_state)
        if c_res: city_name = c_res
        if co_res and not county: county_name = co_res
        if st_res: resolved_state = st_res
        if lbl_res: city_town_label = lbl_res

    state_upper = resolved_state.upper()
    all_legislators = load_congress_data()

    # Filter incumbents by resolved state
    incumbents = [p for p in all_legislators if p.state.upper() == state_upper]

    # Filter candidates dynamically from FEC for resolved state
    all_candidates = get_running_candidates(state_upper)
    candidates = all_candidates

    if district:
        dist_clean = str(int(district)) if district.isdigit() else str(district)
        candidates = [
            c for c in all_candidates
            if not c.district or c.district == dist_clean or c.office in ("Senate", "President")
        ]

    # Fetch dynamic county officials
    county_officials = []
    if county_name:
        county_officials = fetch_dynamic_county_officials(county_name, state_upper)

    # Fetch dynamic municipal/township candidates (Mayor, City Council across discovered cities in county)
    township_candidates = []
    if address or county_name or (city_name and city_name != initial_state):
        township_candidates = fetch_dynamic_township_officials(city_name, state_upper, county_name)

    # Dynamic civic officials query
    civic = fetch_civic_data(address) if address else fetch_civic_data(city_town_label)

    return LocalLookupResponse(
        state=state_upper,
        county=county_name,
        district=district,
        incumbents=incumbents,
        running_candidates=candidates,
        county_officials=county_officials,
        township_candidates=township_candidates,
        civic_officials=civic
    )
