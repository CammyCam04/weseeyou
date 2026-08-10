# region Imports
import os
import requests
from bs4 import BeautifulSoup
from typing import List, Optional
from models.politician import PolicyStanceItem
# endregion

# region Setup
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            line_strip = line.strip()
            if line_strip and not line_strip.startswith("#") and "=" in line_strip:
                key, val = line_strip.split("=", 1)
                os.environ[key.strip()] = val.strip()

FEC_API_KEY = os.environ.get("FEC_API_KEY", "")
# endregion

_stance_cache = {}

UI_BLACKLIST = [
    "contact us", "contact", "offices", "office locations", "newsletter", "subscribe",
    "privacy policy", "accessibility", "search", "connect", "stay connected",
    "navigation", "main menu", "press releases", "header", "footer", "quick links",
    "recent posts", "follow me", "social media", "search site", "get help",
    "washington dc office", "district offices", "sign up", "terms of use"
]

SIGNATURE_CAMPAIGN_PLEDGES = [
    {
        "keywords": ["medicare for all", "single payer", "universal healthcare"],
        "category": "Medicare for All",
        "position": "Campaign Platform Pledge",
        "summary": "Supports expanding Medicare to guarantee universal healthcare coverage for all Americans."
    },
    {
        "keywords": ["green new deal", "climate emergency", "zero emissions"],
        "category": "Green New Deal & Climate Action",
        "position": "Climate Action Pledge",
        "summary": "Pledges support for Green New Deal climate transition and federal renewable energy investment."
    },
    {
        "keywords": ["term limits", "congressional term limits"],
        "category": "Congressional Term Limits",
        "position": "Reform Pledge",
        "summary": "Supports a constitutional amendment imposing term limits on House and Senate members."
    },
    {
        "keywords": ["balanced budget", "balanced budget amendment"],
        "category": "Balanced Budget Amendment",
        "position": "Fiscal Discipline Pledge",
        "summary": "Supports amending the U.S. Constitution to require a balanced federal budget."
    },
    {
        "keywords": ["second amendment", "2nd amendment", "gun rights"],
        "category": "Second Amendment Rights",
        "position": "Gun Rights Pledge",
        "summary": "Advocates for protecting lawful firearm ownership rights against federal gun restrictions."
    },
    {
        "keywords": ["pro act", "worker rights", "union rights"],
        "category": "PRO Act & Labor Rights",
        "position": "Labor Rights Pledge",
        "summary": "Supports the Protecting the Right to Organize (PRO) Act to empower workers and labor unions."
    },
    {
        "keywords": ["border wall", "secure the border", "border enforcement"],
        "category": "Border Security & Infrastructure",
        "position": "Border Enforcement Pledge",
        "summary": "Favors physical border wall construction, increased patrol agent staffing, and strict enforcement."
    },
    {
        "keywords": ["student loan", "debt forgiveness", "college affordability"],
        "category": "Student Loan Debt Relief",
        "position": "Education Debt Pledge",
        "summary": "Advocates for federal student loan forgiveness and capping public university tuition costs."
    },
    {
        "keywords": ["no tax on tips", "tax relief", "lower taxes"],
        "category": "Tax Cut & Wage Relief",
        "position": "Tax Relief Pledge",
        "summary": "Supports eliminating federal income tax on tip income and lowering individual tax rates."
    }
]


def fetch_candidate_accurate_stances(
    bioguide_id: str,
    website_url: Optional[str],
    name: str
) -> List[PolicyStanceItem]:
    """
    Extracts candidate-specific campaign stances & policy priorities:
    1. Scrapes official website text & filters out UI noise (like 'Contact Us').
    2. Matches against signature platform pledges (Medicare for All, Term Limits, Green New Deal, Border Wall, etc.).
    3. Categorizes sponsored & co-sponsored bills from Congress.gov.
    """
    cache_key = bioguide_id.upper()
    if cache_key in _stance_cache:
        return _stance_cache[cache_key]

    stances: List[PolicyStanceItem] = []
    found_categories = set()
    headers = {"User-Agent": "WeSeeYouCivicApp/1.0 (contact@weseeyou.org)"}

    # 1. Fetch website text to match signature campaign promises
    combined_web_text = ""
    if website_url and website_url.startswith("http"):
        base_url = website_url.rstrip("/")
        issue_paths = ["/issues", "/platform", "/priorities", "/about"]
        
        for path in issue_paths:
            try:
                target_url = f"{base_url}{path}"
                resp = requests.get(target_url, headers=headers, timeout=4)
                if resp.status_code == 200 and "html" in resp.headers.get("Content-Type", ""):
                    soup = BeautifulSoup(resp.text, "html.parser")
                    combined_web_text += " " + soup.get_text(" ", strip=True).lower()
            except Exception:
                pass

    # Check web text for signature campaign pledges
    if combined_web_text:
        for pledge in SIGNATURE_CAMPAIGN_PLEDGES:
            if any(kw in combined_web_text for kw in pledge["keywords"]):
                if pledge["category"] not in found_categories:
                    found_categories.add(pledge["category"])
                    stances.append(
                        PolicyStanceItem(
                            category=pledge["category"],
                            position=pledge["position"],
                            summary=pledge["summary"]
                        )
                    )

    # 2. Extract sponsored & cosponsored bills from Congress.gov to categorize actual legislative priorities
    if FEC_API_KEY and len(stances) < 5:
        try:
            url = f"https://api.congress.gov/v3/member/{bioguide_id.upper()}/sponsored-legislation"
            params = {"api_key": FEC_API_KEY, "limit": 15}
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                legs = resp.json().get("sponsoredLegislation", [])
                for leg in legs:
                    title = leg.get("title", "")
                    bill_num = leg.get("number")
                    bill_type = leg.get("type", "Bill")
                    if title and bill_num:
                        title_lower = title.lower()

                        # Check signature pledges in bill titles
                        matched_pledge = False
                        for pledge in SIGNATURE_CAMPAIGN_PLEDGES:
                            if any(kw in title_lower for kw in pledge["keywords"]):
                                matched_pledge = True
                                if pledge["category"] not in found_categories:
                                    found_categories.add(pledge["category"])
                                    stances.append(
                                        PolicyStanceItem(
                                            category=pledge["category"],
                                            position=f"Official Sponsor ({bill_type.upper()}.{bill_num})",
                                            summary=f"Primary sponsor of '{title}'"
                                        )
                                    )
                                    break
                        
                        if not matched_pledge and len(stances) < 5:
                            # General policy category derivation
                            category_name = "Legislative Priority"
                            if any(w in title_lower for w in ["water", "land", "forest", "wildlife", "conservation", "energy", "oil", "gas"]):
                                category_name = "Public Lands, Energy & Resources"
                            elif any(w in title_lower for w in ["tax", "economic", "business", "job", "wage", "trade"]):
                                category_name = "Economy & Tax Policy"
                            elif any(w in title_lower for w in ["health", "medicaid", "medicare", "hospital", "drug", "disease"]):
                                category_name = "Healthcare & Medical Access"
                            elif any(w in title_lower for w in ["veteran", "defense", "military", "armed forces", "security"]):
                                category_name = "Veterans & Defense"
                            elif any(w in title_lower for w in ["tribe", "tribal", "native", "indian"]):
                                category_name = "Tribal Nations & Indigenous Rights"

                            if category_name not in found_categories:
                                found_categories.add(category_name)
                                stances.append(
                                    PolicyStanceItem(
                                        category=category_name,
                                        position=f"Sponsored Legislation ({bill_type.upper()}.{bill_num})",
                                        summary=title
                                    )
                                )
        except Exception as ex:
            print(f"Congress.gov bill query error for {bioguide_id}: {ex}")

    # 3. Add clean website issue headings (skipping UI blacklist)
    if len(stances) < 4 and website_url and website_url.startswith("http"):
        base_url = website_url.rstrip("/")
        try:
            resp = requests.get(f"{base_url}/issues", headers=headers, timeout=4)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                headings = soup.find_all(["h2", "h3", "h4"])
                for h in headings:
                    h_text = h.get_text(strip=True)
                    h_lower = h_text.lower()

                    # Blacklist UI headings
                    if (
                        4 < len(h_text) < 50 
                        and not any(bl in h_lower for bl in UI_BLACKLIST)
                        and h_text not in found_categories
                    ):
                        p_elem = h.find_next("p")
                        p_text = p_elem.get_text(strip=True) if p_elem else f"Official platform stance on {h_text}."
                        if len(p_text) > 15:
                            found_categories.add(h_text)
                            stances.append(
                                PolicyStanceItem(
                                    category=h_text,
                                    position=f"Official Priority ({name})",
                                    summary=p_text[:250] + "..." if len(p_text) > 250 else p_text
                                )
                            )
                            if len(stances) >= 5:
                                break
        except Exception:
            pass

    _stance_cache[cache_key] = stances[:6]
    return _stance_cache[cache_key]
