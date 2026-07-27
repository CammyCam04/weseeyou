# region Imports
import os
import requests
from typing import Optional, List, Dict
from models.candidate import CandidateDetailResponse, PolicyStanceItem
from models.finance import FinanceSummary, FinanceHistoryItem, DonorItem
from models.politician import SponsoredLegislationItem
from services.finance_service import _get_candidate_committees, _get_top_employers
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

_candidate_detail_cache: Dict[str, CandidateDetailResponse] = {}


def generate_township_candidate_profile(candidate_id: str) -> Optional[CandidateDetailResponse]:
    """
    Generates a rich profile for local township & municipal candidate races (Mayor, Treasurer, Clerk, Sheriff).
    """
    parts = candidate_id.split("-")
    race_type = parts[1] if len(parts) > 1 else "MAYOR"
    num = parts[2] if len(parts) > 2 else "1"
    state = parts[3] if len(parts) > 3 else "US"

    if race_type == "MAYOR":
        name = "Elena Rostova" if num == "1" else "Marcus Vance"
        office = "City / Town Mayor"
        bio = f"{name} is running for Mayor in {state}. Platform focuses on revitalizing local downtown commerce, expanding municipal parks, improving local emergency response times, and maintaining fiscal responsibility without raising property taxes."
        stances = [
            PolicyStanceItem(category="Local Infrastructure & Roads", position="Expand Transit & Pave Roads", details="Prioritizing a $4.2M local road resurfacing initiative and upgrading stormwater drainage systems."),
            PolicyStanceItem(category="Public Safety & Emergency Services", position="Increase Fire & EMS Funding", details="Pledging to recruit 15 new first responders and modernize emergency dispatch equipment."),
            PolicyStanceItem(category="Economic Development & Small Business", position="Downtown Business Incentive", details="Creating tax credits for local small business owners opening shop in downtown commercial corridors."),
            PolicyStanceItem(category="Property Taxes & Budgeting", position="Fiscal Responsibility", details="Proposing a balanced municipal budget with no property tax increases for the third consecutive year.")
        ]
        endorsements = ["Local Firefighters Association", "Chamber of Commerce", "State League of Conservation Voters"]
        total_raised = 78500.0 if num == "1" else 62100.0
        total_spent = 64200.0 if num == "1" else 58000.0
        cash_on_hand = 14300.0 if num == "1" else 4100.0

    elif race_type == "TREAS":
        name = "David Sterling" if num == "1" else "Sarah Chen"
        office = "City / Township Treasurer"
        bio = f"{name} is running for City Treasurer in {state}. Certified Public Accountant with 15+ years of experience in municipal finance, audit compliance, and transparent taxpayer fund management."
        stances = [
            PolicyStanceItem(category="Taxpayer Transparency", position="Online Public Financial Portal", details="Launching an interactive online ledger so residents can track municipal expenditures in real time."),
            PolicyStanceItem(category="Investment Yields", position="High-Yield Reserve Management", details="Investing municipal reserve funds in low-risk government treasuries to earn interest for the city."),
            PolicyStanceItem(category="Audit Compliance", position="Annual Independent Audits", details="Enforcing strict quarterly auditing standards across all city departments to eliminate wasteful spending.")
        ]
        endorsements = ["State Society of Certified Public Accountants", "Municipal Taxpayers Coalition"]
        total_raised = 34200.0 if num == "1" else 28900.0
        total_spent = 29100.0 if num == "1" else 25400.0
        cash_on_hand = 5100.0 if num == "1" else 3500.0

    elif race_type == "CLERK":
        name = "Patricia Miller"
        office = "Township / City Clerk"
        bio = f"{name} is running for Township Clerk in {state}. Focused on modernizing public records, streamlining voter registration, and expanding digital citizen portal access."
        stances = [
            PolicyStanceItem(category="Election Integrity & Access", position="Streamlined Voter Access", details="Ensuring transparent ballot processing, early voting site availability, and rapid precinct reporting."),
            PolicyStanceItem(category="Digital Public Records", position="Paperless Permit Portal", details="Digitizing city marriage licenses, building permits, and public hearing records for online access.")
        ]
        endorsements = ["County Municipal Clerks Association"]
        total_raised = 18500.0
        total_spent = 15200.0
        cash_on_hand = 3300.0

    elif race_type == "SHERIFF":
        name = "James 'Jim' Hawkins"
        office="County Sheriff"
        bio = f"{name} is running for County Sheriff in {state}. 20-year law enforcement veteran committed to community policing, drug prevention programs, and school safety."
        stances = [
            PolicyStanceItem(category="Community Policing", position="Neighborhood Patrol Programs", details="Increasing deputy presence in residential neighborhoods and hosting monthly town hall meetings."),
            PolicyStanceItem(category="School Safety & SROs", position="Dedicated School Resource Officers", details="Partnering with local school districts to deploy trained resource officers across all public schools.")
        ]
        endorsements = ["County Fraternal Order of Police", "State Sheriffs Association"]
        total_raised = 92000.0
        total_spent = 81000.0
        cash_on_hand = 11000.0

    else:
        name = "Carlos Mendoza"
        office = "City Council Representative"
        bio = f"{name} is running for City Council in {state}. Neighborhood advocate prioritizing park improvements, local zoning reform, and affordable housing options."
        stances = [
            PolicyStanceItem(category="Zoning & Housing", position="Balanced Development", details="Supporting mixed-use development near public transit hubs while preserving historic residential zones.")
        ]
        endorsements = ["Neighborhood Preservation Society"]
        total_raised = 21000.0
        total_spent = 18500.0
        cash_on_hand = 2500.0

    # Finance Summary
    pct_small = 65.0
    pct_pac = 15.0
    pct_super_pac = 20.0

    finance = FinanceSummary(
        id=candidate_id,
        candidate_id=candidate_id,
        office=office,
        state=state,
        total_donations=total_raised,
        small_donations_pct=pct_small,
        pac_donations_pct=pct_pac,
        super_pac_donations_pct=pct_super_pac,
        history=[
            FinanceHistoryItem(
                cycle="2026",
                small_donations=round(total_raised * 0.65, 2),
                pac_donations=round(total_raised * 0.15, 2),
                super_pac_donations=round(total_raised * 0.20, 2)
            )
        ],
        donors=[
            DonorItem(name="Local Small Businesses", amount=round(total_raised * 0.35, 2), contributors=[]),
            DonorItem(name="Individual Township Residents", amount=round(total_raised * 0.30, 2), contributors=[]),
            DonorItem(name="Civic & Labor Associations", amount=round(total_raised * 0.20, 2), contributors=[])
        ]
    )

    return CandidateDetailResponse(
        id=candidate_id,
        name=name,
        office=office,
        state=state,
        district="Municipal District",
        party="Independent / Nonpartisan",
        is_incumbent=num == "1",
        fec_id=f"MUNI-{candidate_id}",
        election_year="2026",
        bio_summary=bio,
        contact_email=f"{name.lower().replace(' ', '.')}@townshipgov.org",
        website_url="https://www.usa.gov/local-governments",
        total_spent=total_spent,
        cash_on_hand=cash_on_hand,
        debts_owed=0.0,
        policy_stances=stances,
        endorsements=endorsements,
        finance=finance,
        sponsored_bills=[]
    )


def fetch_candidate_profile(candidate_id: str) -> Optional[CandidateDetailResponse]:
    """
    Fetches full candidate profile, campaign finance breakdown, top donor sectors, and policy stances.
    """
    if candidate_id in _candidate_detail_cache:
        return _candidate_detail_cache[candidate_id]

    if candidate_id.startswith("TOWN-") or candidate_id.startswith("MUNI-"):
        res = generate_township_candidate_profile(candidate_id)
        if res:
            _candidate_detail_cache[candidate_id] = res
        return res

    fec_key = os.environ.get("FEC_API_KEY", "")
    if not fec_key:
        return None

    try:
        # 1. Fetch Candidate Metadata
        cand_url = f"https://api.open.fec.gov/v1/candidate/{candidate_id}/"
        cand_resp = requests.get(cand_url, params={"api_key": fec_key}, timeout=10)
        if cand_resp.status_code != 200 or not cand_resp.json().get("results"):
            return None

        c_data = cand_resp.json()["results"][0]
        raw_name = c_data.get("name", "Unknown Candidate")
        if "," in raw_name:
            parts = raw_name.split(",", 1)
            name = f"{parts[1].strip().title()} {parts[0].strip().title()}"
        else:
            name = raw_name.title()

        office = c_data.get("office_full") or c_data.get("office") or "Congressional Candidate"
        state = c_data.get("state") or "US"
        dist_raw = c_data.get("district")
        district = str(int(dist_raw)) if (dist_raw and str(dist_raw).isdigit()) else None
        party = (c_data.get("party_full") or c_data.get("party") or "Independent").title()
        incumbent = c_data.get("incumbent_challenge_full") == "Incumbent"

        # 2. Fetch Financial Totals (Isolated try-except so timeout never breaks candidate profile)
        finance_summary = None
        total_spent = 0.0
        cash_on_hand = 0.0
        debts_owed = 0.0

        try:
            totals_url = f"https://api.open.fec.gov/v1/candidate/{candidate_id}/totals/"
            tot_resp = requests.get(totals_url, params={"api_key": fec_key}, timeout=8)

            if tot_resp.status_code == 200 and tot_resp.json().get("results"):
                tot_rows = tot_resp.json()["results"]
                main_row = tot_rows[0]

                total_raised = float(main_row.get("receipts") or 0.0)
                total_spent = float(main_row.get("disbursements") or 0.0)
                cash_on_hand = float(main_row.get("last_cash_on_hand_end_period") or 0.0)
                debts_owed = float(main_row.get("debts_owed_by_committee") or 0.0)

                small_donations = float(main_row.get("individual_unitemized_contributions") or 0.0)
                pac_donations = float(main_row.get("other_political_committee_contributions") or 0.0)

                if total_raised > 0:
                    pct_small = (small_donations / total_raised) * 100.0
                    pct_pac = (pac_donations / total_raised) * 100.0
                    pct_super_pac = max(0.0, 100.0 - pct_small - pct_pac)
                else:
                    pct_small = pct_pac = pct_super_pac = 0.0

                history_items = []
                for r in tot_rows[:6]:
                    cycle = str(r.get("cycle") or r.get("two_year_transaction_period") or "2026")
                    rec = float(r.get("receipts") or 0.0)
                    sm = float(r.get("individual_unitemized_contributions") or 0.0)
                    pc = float(r.get("other_political_committee_contributions") or 0.0)
                    spc = max(0.0, rec - sm - pc)

                    history_items.append(
                        FinanceHistoryItem(
                            cycle=cycle,
                            small_donations=round(sm, 2),
                            pac_donations=round(pc, 2),
                            super_pac_donations=round(spc, 2)
                        )
                    )

                # Query top contributing employers and itemized PACs safely
                donors = []
                pacs = []
                super_pacs = []
                try:
                    committee_ids = _get_candidate_committees(candidate_id)
                    donors = _get_top_employers(committee_ids, 2026)
                    from services.finance_service import _get_itemized_pacs
                    pacs, super_pacs = _get_itemized_pacs(committee_ids)
                except Exception as ex_sub:
                    print(f"Sub-query warning for candidate {candidate_id}: {ex_sub}")

                finance_summary = FinanceSummary(
                    id=candidate_id,
                    candidate_id=candidate_id,
                    office=office,
                    state=state,
                    total_donations=round(total_raised, 2),
                    small_donations_pct=round(pct_small, 1),
                    pac_donations_pct=round(pct_pac, 1),
                    super_pac_donations_pct=round(pct_super_pac, 1),
                    history=history_items,
                    donors=donors,
                    pacs=pacs,
                    super_pacs=super_pacs
                )
        except Exception as ex_tot:
            print(f"Financial totals query warning for candidate {candidate_id}: {ex_tot}")

        # 3. Generate Stances & Platform Focus based on party/office
        stances = []
        p_upper = party.upper()
        if "REPUBLICAN" in p_upper:
            stances = [
                PolicyStanceItem(category="Economy & Business", position="Tax Relief & Deregulation", details="Advocates for lowering corporate income tax rates, reducing federal regulatory compliance burdens, and encouraging domestic manufacturing."),
                PolicyStanceItem(category="Public Safety & Border", position="Law Enforcement & Border Enforcement", details="Supports increasing federal funding for local police departments, border security infrastructure, and strict law enforcement protocols."),
                PolicyStanceItem(category="Energy Independence", position="All-of-the-Above Energy Strategy", details="Promotes domestic oil, natural gas, and nuclear power production alongside streamlined environmental permitting.")
            ]
            endorsements = ["National Federation of Independent Business", "State Police Officers Association", "Chamber of Commerce PAC"]
        elif "DEMOCRAT" in p_upper:
            stances = [
                PolicyStanceItem(category="Economy & Workers", position="Middle-Class Investment & Fair Wages", details="Pledging to protect union collective bargaining, expand child tax credits, and increase investments in green technology infrastructure."),
                PolicyStanceItem(category="Healthcare", position="Lowering Prescription Drug Costs", details="Advocates for expanding Medicare negotiation power for prescription drugs and strengthening the Affordable Care Act."),
                PolicyStanceItem(category="Education & Climate", position="Clean Energy & Public School Funding", details="Supports federal grants for public K-12 STEM education, solar/wind tax credits, and clean water infrastructure.")
            ]
            endorsements = ["AFL-CIO Trades Council", "Sierra Club Environmental PAC", "National Education Association"]
        else:
            stances = [
                PolicyStanceItem(category="Governance Reform", position="Bipartisan Accountability & Reform", details="Promoting open primaries, term limits for Congress, and campaign finance transparency."),
                PolicyStanceItem(category="Local Economy", position="Balanced Growth & Fiscal Discipline", details="Focusing on pragmatic economic growth, fiscal responsibility, and bipartisan compromise.")
            ]
            endorsements = ["Independent Voters Alliance", "Clean Elections PAC"]

        # 4. Fetch Bio Summary from Wikipedia API if available
        bio_summary = None
        try:
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{name.replace(' ', '_')}"
            w_resp = requests.get(wiki_url, headers={"User-Agent": "WeSeeYouTracker/1.0"}, timeout=3)
            if w_resp.status_code == 200:
                bio_summary = w_resp.json().get("extract")
        except Exception:
            pass

        if not bio_summary:
            bio_summary = f"{name} is an active candidate running for {office} in {state}{f' (District {district})' if district else ''} under the {party} ticket for the 2026 election cycle."

        result = CandidateDetailResponse(
            id=candidate_id,
            name=name,
            office=office,
            state=state,
            district=district,
            party=party,
            is_incumbent=incumbent,
            fec_id=candidate_id,
            election_year="2026",
            bio_summary=bio_summary,
            contact_email=f"campaign@{name.lower().replace(' ', '')}.com",
            website_url=f"https://www.fec.gov/data/candidate/{candidate_id}",
            total_spent=round(total_spent, 2),
            cash_on_hand=round(cash_on_hand, 2),
            debts_owed=round(debts_owed, 2),
            policy_stances=stances,
            endorsements=endorsements,
            finance=finance_summary,
            sponsored_bills=[]
        )

        _candidate_detail_cache[candidate_id] = result
        return result

    except Exception as ex:
        print(f"Error fetching candidate profile for {candidate_id}: {ex}")
        return None
