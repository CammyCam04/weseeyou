# region Imports
from typing import List
from models import PoliticianDetail, Party, Chamber
# endregion

# region Mock Data
MOCK_POLITICIANS: List[PoliticianDetail] = [
    PoliticianDetail(
        id="B001230",
        first_name="Bernie",
        last_name="Sanders",
        title="Senator",
        state="VT",
        party=Party.INDEPENDENT,
        chamber=Chamber.SENATE,
        date_of_birth="1941-09-08",
        gender="M",
        twitter_account="SenSanders",
        facebook_account="senatorsanders",
        youtube_account="SenatorSanders",
        website_url="https://www.sanders.senate.gov",
        next_election="2024",
        profile_image_url="https://upload.wikimedia.org/wikipedia/commons/0/0a/Bernie_Sanders_in_March_2020.jpg",
        stances=[
            "Medicare for All",
            "Green New Deal",
            "Tuition-Free Public Colleges",
            "Wealth Tax on Billionaires"
        ],
        affiliations=[
            "Democratic Socialists of America (former member)",
            "Senate Budget Committee"
        ],
        controversies=[
            "Criticism of Democratic Party establishment",
            "1980s trip to the Soviet Union"
        ]
    ),
    PoliticianDetail(
        id="R000456",
        first_name="Mitt",
        last_name="Romney",
        title="Senator",
        state="UT",
        party=Party.REPUBLICAN,
        chamber=Chamber.SENATE,
        date_of_birth="1947-03-12",
        gender="M",
        twitter_account="SenatorRomney",
        facebook_account="senatorromney",
        youtube_account="SenatorRomney",
        website_url="https://www.romney.senate.gov",
        next_election="2024",
        profile_image_url="https://upload.wikimedia.org/wikipedia/commons/e/ec/Mitt_Romney_official_portrait_116th_Congress.jpg",
        stances=[
            "Fiscal Conservatism",
            "Private Sector Solutions to Climate Change",
            "Bipartisan Infrastructure Bill Support",
            "Strong Defense Policy"
        ],
        affiliations=[
            "Bipartisan Senate Group",
            "Senate Foreign Relations Committee"
        ],
        controversies=[
            "Voted to impeach Donald Trump (twice)",
            "Criticism during 2012 presidential run (e.g., '47 percent' remarks)"
        ]
    ),
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
# endregion
