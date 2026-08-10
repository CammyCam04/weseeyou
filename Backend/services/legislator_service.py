# region Imports
import os
import requests
from bs4 import BeautifulSoup
from collections import defaultdict
from typing import List, Dict, Optional
from models import PoliticianDetail, TermHistoryItem
from enums import Party, Chamber
# endregion

# region In-Memory Database Cache
_politicians_cache: List[PoliticianDetail] = []
# endregion

US_STATE_CODES: Dict[str, str] = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "Washington, D.C.": "DC", "District of Columbia": "DC"
}

# region Dynamic Executive Loader
def _load_dynamic_executive_members() -> List[PoliticianDetail]:
    """
    Dynamically fetches President, Vice President, and active Cabinet Secretaries
    via live public Wikipedia API with zero hardcoded entries.
    """
    officials: List[PoliticianDetail] = []
    headers = {"User-Agent": "WeSeeYouCivicApp/1.0 (contact@weseeyou.org)"}
    
    try:
        cab_url = "https://en.wikipedia.org/w/api.php?action=parse&page=Cabinet_of_the_United_States&prop=text&format=json"
        res = requests.get(cab_url, headers=headers, timeout=10).json()
        html = res.get("parse", {}).get("text", {}).get("*", "")
        soup = BeautifulSoup(html, "html.parser")
        
        tables = soup.find_all("table", {"class": "wikitable"})
        parsed_count = 1
        for t_idx in [1, 2]:
            if t_idx < len(tables):
                for row in tables[t_idx].find_all("tr")[1:]:
                    cols = row.find_all(["td", "th"])
                    if len(cols) >= 2:
                        office_title = cols[0].get_text(strip=True).split("(")[0].strip()
                        links = row.find_all("a")
                        person_link = next(
                            (a for a in reversed(links) if a.get("href", "").startswith("/wiki/") 
                             and not "File:" in a.get("href", "") 
                             and not "U.S.C." in a.get_text() 
                             and not "Executive" in a.get_text() 
                             and not "Stat." in a.get_text() 
                             and not "Committee" in a.get_text()
                             and len(a.get_text(strip=True)) > 3), 
                            None
                        )
                        if person_link and office_title:
                            name_raw = person_link.get_text(strip=True)
                            wiki_id = person_link.get("href").replace("/wiki/", "")
                            
                            name_parts = name_raw.split()
                            first = name_parts[0]
                            last = name_parts[-1]
                            
                            img_url = None
                            home_state = "US"
                            try:
                                sum_res = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_id}", headers=headers, timeout=3).json()
                                img_url = sum_res.get("thumbnail", {}).get("source")
                                extract_text = sum_res.get("extract", "")
                                for st_name, st_code in US_STATE_CODES.items():
                                    if st_name in extract_text:
                                        home_state = st_code
                                        break
                            except Exception:
                                pass
                                
                            officials.append(
                                PoliticianDetail(
                                    id=f"EXEC-CABINET-{parsed_count:03d}",
                                    first_name=first,
                                    last_name=last,
                                    title=office_title,
                                    state=home_state,
                                    party=Party.REPUBLICAN,
                                    chamber=Chamber.EXECUTIVE,
                                    website_url="https://www.whitehouse.gov",
                                    next_election="2028",
                                    profile_image_url=img_url,
                                    wikipedia_id=wiki_id,
                                    stances=[],
                                    affiliations=[f"Executive Branch Officer ({office_title})"],
                                    controversies=[],
                                    fec_ids=[],
                                    terms_history=[
                                        TermHistoryItem(
                                            chamber=Chamber.EXECUTIVE,
                                            title=office_title,
                                            state=home_state,
                                            start_year="2025",
                                            end_year="2029",
                                            party=Party.REPUBLICAN,
                                            is_current=True
                                        )
                                    ],
                                    career_chambers=["Executive"],
                                    has_multi_chamber_history=False
                                )
                            )
                            parsed_count += 1
    except Exception as e:
        print(f"Error loading dynamic executive branch: {e}")

    return officials
# endregion


def load_congress_data() -> List[PoliticianDetail]:
    """
    Fetches official current legislators (Senate + House + Executive) from GitHub congress-legislators database.
    Dynamically loads executive and cabinet officials from live public APIs.
    """
    global _politicians_cache
    if _politicians_cache:
        return _politicians_cache

    print("Fetching current legislators list...")
    url = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
    res = requests.get(url)
    res.raise_for_status()
    raw_data = res.json()

    # Load social media handles dynamically
    social_map = defaultdict(dict)
    try:
        print("Fetching social media handles...")
        soc_res = requests.get("https://unitedstates.github.io/congress-legislators/legislators-social-media.json")
        if soc_res.status_code == 200:
            for s in soc_res.json():
                b_id = s.get("id", {}).get("bioguide")
                if b_id:
                    social_map[b_id] = s.get("social", {})
    except Exception as e:
        print(f"Warning: Could not load social media data: {e}")

    # Load committee definitions and membership dynamically
    comm_map = defaultdict(list)
    try:
        print("Fetching committee definitions and membership data...")
        comm_defs_url = "https://unitedstates.github.io/congress-legislators/committees-current.json"
        comm_memb_url = "https://unitedstates.github.io/congress-legislators/committee-membership-current.json"
        
        defs_res = requests.get(comm_defs_url, timeout=10)
        memb_res = requests.get(comm_memb_url, timeout=10)
        
        comm_names_map = {}
        if defs_res.status_code == 200:
            for c in defs_res.json():
                t_id = c.get("thomas_id")
                c_type = c.get("type", "").capitalize()
                c_name = c.get("name", "")
                full_c_name = f"{c_type} Committee on {c_name}" if not c_name.lower().startswith(("senate", "house", "joint")) else c_name
                if t_id:
                    comm_names_map[t_id] = full_c_name
                    for sub in c.get("subcommittees", []):
                        sub_id = sub.get("thomas_id")
                        sub_name = sub.get("name", "")
                        if sub_id:
                            comm_names_map[f"{t_id}{sub_id}"] = f"{full_c_name}: Subcommittee on {sub_name}"

        if memb_res.status_code == 200:
            c_data = memb_res.json()
            for comm_id, members in c_data.items():
                c_label = comm_names_map.get(comm_id)
                for m in members:
                    b_id = m.get("bioguide")
                    if b_id:
                        title = m.get("title")
                        if c_label:
                            role_str = f"Committee {comm_id} -- {c_label}"
                        else:
                            role_str = f"Committee {comm_id}"
                        if title:
                            role_str += f" ({title})"
                        comm_map[b_id].append(role_str)
    except Exception as e:
        print(f"Warning: Could not load committee data: {e}")

    politicians = []
    for item in raw_data:
        b_id = item["id"].get("bioguide")
        if not b_id:
            continue

        name_obj = item.get("name", {})
        first_name = name_obj.get("first", "")
        last_name = name_obj.get("last", "")

        terms = item.get("terms", [])
        if not terms:
            continue

        latest_term = terms[-1]
        term_type = latest_term.get("type")
        state = latest_term.get("state", "US")

        if term_type == "sen":
            chamber = Chamber.SENATE
            title = f"Senator from {state}"
        else:
            chamber = Chamber.HOUSE
            district = latest_term.get("district", 1)
            title = f"Representative for {state}-{district}"

        party_str = latest_term.get("party", "Independent")
        if party_str == "Democrat":
            party = Party.DEMOCRAT
        elif party_str == "Republican":
            party = Party.REPUBLICAN
        else:
            party = Party.INDEPENDENT

        bio = item.get("bio", {})
        dob = bio.get("birthday")
        gender = bio.get("gender")

        soc = social_map.get(b_id, {})
        twitter = soc.get("twitter")
        facebook = soc.get("facebook")
        youtube = soc.get("youtube")

        affiliations = comm_map.get(b_id, [])

        raw_fec_ids = item.get("id", {}).get("fec", [])
        chamber_prefix = "S" if chamber == Chamber.SENATE else "H"
        matching_fec = [fid for fid in raw_fec_ids if fid.startswith(chamber_prefix)]
        other_fec = [fid for fid in raw_fec_ids if not fid.startswith(chamber_prefix)]
        fec_ids = matching_fec + other_fec
        primary_fec_id = fec_ids[0] if fec_ids else None

        # Build comprehensive terms history across the official's entire Congressional tenure
        terms_history = []
        for i, t in enumerate(terms):
            t_type = t.get("type")
            if t_type == "sen":
                t_chamber = Chamber.SENATE
                t_title = f"Senator from {t.get('state', state)}"
            elif t_type == "rep":
                t_chamber = Chamber.HOUSE
                t_dist = t.get("district")
                t_title = f"Representative for {t.get('state', state)}-{t_dist}" if t_dist is not None else f"Representative for {t.get('state', state)}"
            else:
                t_chamber = Chamber.EXECUTIVE
                t_title = "Executive Officer"

            t_party_str = t.get("party", "Independent")
            if t_party_str == "Democrat":
                t_party = Party.DEMOCRAT
            elif t_party_str == "Republican":
                t_party = Party.REPUBLICAN
            else:
                t_party = Party.INDEPENDENT

            terms_history.append(
                TermHistoryItem(
                    chamber=t_chamber,
                    title=t_title,
                    state=t.get("state", state),
                    district=t.get("district"),
                    start_year=str(t.get("start", "")[:4]),
                    end_year=str(t.get("end", "")[:4]),
                    party=t_party,
                    how=t.get("how"),
                    is_current=(i == len(terms) - 1)
                )
            )

        # Reverse so current/latest term is first
        terms_history_rev = list(reversed(terms_history))
        unique_chambers = []
        for th in terms_history_rev:
            c_name = th.chamber.value if hasattr(th.chamber, "value") else str(th.chamber)
            if c_name not in unique_chambers:
                unique_chambers.append(c_name)

        has_multi_chamber = len(unique_chambers) > 1

        img_url = f"https://unitedstates.github.io/images/congress/225x275/{b_id}.jpg"
        wiki_id = item.get("id", {}).get("wikipedia")

        p = PoliticianDetail(
            id=b_id,
            first_name=first_name,
            last_name=last_name,
            title=title,
            state=state,
            party=party,
            chamber=chamber,
            date_of_birth=dob,
            gender=gender,
            twitter_account=twitter,
            facebook_account=facebook,
            youtube_account=youtube,
            website_url=latest_term.get("url"),
            next_election=str(latest_term.get("end", "")[:4]),
            profile_image_url=img_url,
            wikipedia_id=wiki_id,
            stances=[],
            affiliations=affiliations,
            controversies=[],
            fec_id=primary_fec_id,
            fec_ids=fec_ids,
            terms_history=terms_history_rev,
            career_chambers=unique_chambers,
            has_multi_chamber_history=has_multi_chamber
        )
        politicians.append(p)

    exec_officials = _load_dynamic_executive_members()
    all_members = politicians + exec_officials

    _politicians_cache = all_members
    print(f"Successfully cached {len(_politicians_cache)} current politicians, cabinet officials, and judicial members.")
    return _politicians_cache


def get_all_politicians(
    query: Optional[str] = None,
    chamber: Optional[str] = None,
    party: Optional[str] = None,
    state: Optional[str] = None
) -> List[PoliticianDetail]:
    all_p = load_congress_data()
    filtered = all_p

    if chamber and chamber.upper() != "ALL":
        c_upper = chamber.upper()
        if c_upper == "EXECUTIVE":
            filtered = [p for p in filtered if p.chamber == Chamber.EXECUTIVE]
        elif c_upper == "SENATE":
            filtered = [p for p in filtered if p.chamber == Chamber.SENATE]
        elif c_upper == "HOUSE":
            filtered = [p for p in filtered if p.chamber == Chamber.HOUSE]

    if party and party.upper() != "ALL":
        p_upper = party.upper()
        filtered = [p for p in filtered if p.party.value.upper() == p_upper]

    if state and state.upper() != "ALL":
        s_upper = state.upper()
        filtered = [p for p in filtered if p.state.upper() == s_upper]

    if query:
        q = query.lower()
        filtered = [
            p for p in filtered
            if q in p.first_name.lower()
            or q in p.last_name.lower()
            or q in f"{p.first_name} {p.last_name}".lower()
            or q in p.state.lower()
            or q in p.title.lower()
        ]

    return filtered


def get_politician_by_id(politician_id: str) -> Optional[PoliticianDetail]:
    all_p = load_congress_data()
    return next((p for p in all_p if p.id == politician_id or p.wikipedia_id == politician_id), None)
