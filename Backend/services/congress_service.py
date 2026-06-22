# region Imports
import requests
from typing import List, Dict, Optional
from models import PoliticianDetail, Party, Chamber
# endregion

# region In-Memory Database Cache
_politicians_cache: List[PoliticianDetail] = []
# endregion

# region Rich Data for Key Politicians
# We store the hand-crafted rich profiles for prominent politicians here,
# keyed by their official Bioguide ID.
RICH_POLITICIAN_DATA: Dict[str, Dict[str, List[str]]] = {
    "S000033": {  # Bernie Sanders
        "stances": [
            "Medicare for All (single-payer healthcare)",
            "Green New Deal and massive climate investments",
            "Tuition-free public colleges and universities",
            "Wealth tax on billionaires to reduce inequality",
            "Raising the federal minimum wage to $15/hour"
        ],
        "affiliations": [
            "Senate Budget Committee (Chair/Member)",
            "Senate Committee on Health, Education, Labor, and Pensions",
            "Democratic Socialists of America (former member)"
        ],
        "controversies": [
            "Vocal criticisms of the Democratic Party establishment despite caucusing with them",
            "Historical stances on gun control in the 1990s",
            "Scrutiny over his 1988 honeymoon trip to the Soviet Union"
        ]
    },
    "R000615": {  # Mitt Romney
        "stances": [
            "Fiscal conservatism and national debt reduction",
            "Private sector and market-based solutions to climate change",
            "Support for bipartisan compromise (e.g., Infrastructure Bill)",
            "Strong, hawkish foreign policy and defense posture",
            "Proposed the Family Security Act (child tax benefit)"
        ],
        "affiliations": [
            "Senate Committee on Foreign Relations",
            "Senate Committee on Homeland Security and Governmental Affairs",
            "Bipartisan Senate Group"
        ],
        "controversies": [
            "Voted to convict President Donald Trump in both impeachment trials",
            "Criticism from the conservative wing of the GOP as a 'RINO' (Republican in name only)",
            "Controversial remarks during his 2012 presidential campaign (e.g., '47 percent' comment)"
        ]
    }
}
# endregion

# region Helper: Generate Realistic Fallback Data
def generate_fallback_data(party: Party, state: str) -> Dict[str, List[str]]:
    """
    Generates realistic, politically aligned stances, affiliations, and controversies
    for other members of Congress based on their party and state.
    """
    if party == Party.DEMOCRAT:
        return {
            "stances": [
                "Expanding access to affordable healthcare via the Affordable Care Act",
                "Supporting federal investments in renewable energy and green infrastructure",
                "Protecting and expanding voting rights through federal legislation",
                "Supporting background checks and common-sense gun safety measures",
                "Defending reproductive rights and abortion access nationwide"
            ],
            "affiliations": [
                f"Congressional Democratic Caucus",
                f"Representative of the State of {state}",
                "House/Senate standing committees"
            ],
            "controversies": [
                "Criticism from conservative opponents over government spending policies",
                "Voted along party lines on major partisan legislation"
            ]
        }
    elif party == Party.REPUBLICAN:
        return {
            "stances": [
                "Promoting energy independence and domestic oil/gas production",
                "Lowering corporate and individual tax rates to stimulate growth",
                "Securing the southern border and enforcing strict immigration laws",
                "Defending Second Amendment rights and firearms ownership",
                "Advocating for school choice and educational voucher systems"
            ],
            "affiliations": [
                f"House/Senate Republican Conference",
                f"Representative of the State of {state}",
                "Conservative policy coalitions"
            ],
            "controversies": [
                "Criticism from liberal opponents regarding climate policy stances",
                "Criticism from Democrats over voting patterns on social and tax bills"
            ]
        }
    else:  # Independent or Third Party
        return {
            "stances": [
                "Supporting campaign finance reform and reducing special interest money",
                "Advocating for bipartisan compromises on infrastructure and budget bills",
                "Promoting voting reforms like ranked-choice voting",
                "Fostering independent oversight of federal agencies"
            ],
            "affiliations": [
                "Independent Coalition",
                f"Servant of the people of {state}"
            ],
            "controversies": [
                "Faces strategic challenges runninng elections without major party funding",
                "Frequent pressure to align or caucus with one of the major parties"
            ]
        }
# endregion

# region Data Loader Service
def load_congress_data() -> List[PoliticianDetail]:
    """
    Fetches the current members of Congress and their social media handles,
    merges them into in-memory caches, and maps them to our Pydantic schema.
    """
    global _politicians_cache
    if _politicians_cache:
        return _politicians_cache

    try:
        print("Fetching current legislators list...")
        legislators_url = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
        legislators_resp = requests.get(legislators_url, timeout=10)
        legislators_resp.raise_for_status()
        legislators = legislators_resp.json()

        print("Fetching social media handles...")
        social_url = "https://unitedstates.github.io/congress-legislators/legislators-social-media.json"
        social_resp = requests.get(social_url, timeout=10)
        social_resp.raise_for_status()
        social_list = social_resp.json()
        
        # Index social media entries by bioguide_id for O(1) lookups
        social_map: Dict[str, dict] = {}
        for entry in social_list:
            bioguide_id = entry.get("id", {}).get("bioguide")
            if bioguide_id:
                social_map[bioguide_id] = entry.get("social", {})

        loaded_politicians = []
        for leg in legislators:
            bioguide_id = leg.get("id", {}).get("bioguide")
            if not bioguide_id:
                continue

            # Parse names
            name_info = leg.get("name", {})
            first_name = name_info.get("first", "")
            last_name = name_info.get("last", "")

            # Parse bio details
            bio_info = leg.get("bio", {})
            dob = bio_info.get("birthday", "1970-01-01")
            gender = bio_info.get("gender", "M")

            # Parse current term details
            terms = leg.get("terms", [])
            if not terms:
                continue
            current_term = terms[-1]
            state = current_term.get("state", "US")
            
            # Map Chamber
            term_type = current_term.get("type", "rep")
            title = "Senator" if term_type == "sen" else "Representative"
            chamber = Chamber.SENATE if term_type == "sen" else Chamber.HOUSE

            # Map Party
            party_raw = current_term.get("party", "")
            if party_raw == "Democrat":
                party = Party.DEMOCRAT
            elif party_raw == "Republican":
                party = Party.REPUBLICAN
            else:
                party = Party.INDEPENDENT

            # Generate profile image URL from the official congressional image library
            profile_image_url = f"https://theunitedstates.io/images/congress/225x275/{bioguide_id}.jpg"

            # Parse social handles
            social = social_map.get(bioguide_id, {})
            twitter_account = social.get("twitter")
            facebook_account = social.get("facebook")
            youtube_account = social.get("youtube")
            website_url = current_term.get("url")

            # Parse next election year
            end_date = current_term.get("end", "")
            next_election = end_date[:4] if end_date else None

            # Get stances, affiliations, controversies (rich profile or generated)
            if bioguide_id in RICH_POLITICIAN_DATA:
                extra = RICH_POLITICIAN_DATA[bioguide_id]
            else:
                extra = generate_fallback_data(party, state)

            politician = PoliticianDetail(
                id=bioguide_id,
                first_name=first_name,
                last_name=last_name,
                title=title,
                state=state,
                party=party,
                chamber=chamber,
                date_of_birth=dob,
                gender=gender,
                profile_image_url=profile_image_url,
                twitter_account=twitter_account,
                facebook_account=facebook_account,
                youtube_account=youtube_account,
                website_url=website_url,
                next_election=next_election,
                stances=extra.get("stances", []),
                affiliations=extra.get("affiliations", []),
                controversies=extra.get("controversies", [])
            )
            loaded_politicians.append(politician)

        # Include executive branch members (like Vice President Kamala Harris) manually
        # since she is not in the legislative JSON, keeping it aligned with original mock data.
        executive_members = [
            PoliticianDetail(
                id="H000789",
                first_name="Kamala",
                last_name="Harris",
                title="Vice President",
                state="CA",
                party=Party.DEMOCRAT,
                chamber=Chamber.EXECUTIVE,
                date_of_birth="1964-10-20",
                gender="F",
                twitter_account="VP",
                facebook_account="VicePresident",
                youtube_account="VP",
                website_url="https://www.whitehouse.gov/administration/vice-president-harris",
                next_election="2024",
                profile_image_url="https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
                stances=[
                    "Voting Rights Protection",
                    "Reproductive Freedom Advocacy",
                    "Clean Energy Investments",
                    "Criminal Justice Reform"
                ],
                affiliations=[
                    "Biden-Harris Administration",
                    "Congressional Black Caucus"
                ],
                controversies=[
                    "Scrutiny over prosecutorial record in California ('Kamala is a cop')",
                    "Criticism of administration handling of border policy tasks"
                ]
            )
        ]
        
        # Prepend executive members
        _politicians_cache = executive_members + loaded_politicians
        print(f"Successfully cached {len(_politicians_cache)} current politicians.")
        return _politicians_cache

    except Exception as e:
        print(f"Error loading congress data: {e}")
        # Fallback to empty cache on critical error, or handle gracefully
        return _politicians_cache
# endregion
