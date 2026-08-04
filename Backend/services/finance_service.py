# region Imports
import os
import requests
from collections import defaultdict
from typing import Dict, List
from models import (
    FinanceSummary,
    FinanceHistoryItem,
    DonorItem,
    PacItem,
    IndustrySectorItem,
    IndependentExpenditureItem
)
from services.legislator_service import load_congress_data
# endregion

# region Environment Variable Loader
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            line_strip = line.strip()
            if line_strip and not line_strip.startswith("#") and "=" in line_strip:
                key, val = line_strip.split("=", 1)
                os.environ[key] = val

FEC_API_KEY = os.environ.get("FEC_API_KEY", "")
# endregion

_finance_cache: Dict[str, Dict[str, FinanceSummary]] = {}
_candidate_committees_cache: Dict[str, List[str]] = {}


def _get_candidate_committees(fec_id: str) -> List[str]:
    if fec_id in _candidate_committees_cache:
        return _candidate_committees_cache[fec_id]
        
    committees = []
    if FEC_API_KEY:
        try:
            url = f"https://api.open.fec.gov/v1/candidate/{fec_id}/committees/"
            resp = requests.get(url, params={"api_key": FEC_API_KEY}, timeout=5)
            if resp.status_code == 200:
                for comm in resp.json().get("results", []):
                    if comm_id := comm.get("committee_id"):
                        committees.append(comm_id)
        except Exception as ex:
            print(f"Error fetching committees for candidate {fec_id}: {ex}")
            
    _candidate_committees_cache[fec_id] = committees
    return committees


def _get_top_employers(committee_ids: List[str], cycle: int) -> List[DonorItem]:
    if not committee_ids or not FEC_API_KEY:
        return []
        
    employer_totals = defaultdict(float)
    for comm_id in committee_ids:
        try:
            url = "https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/"
            params = {
                "api_key": FEC_API_KEY,
                "committee_id": comm_id,
                "cycle": cycle,
                "sort_hide_null": "true",
                "sort": "-total",
                "per_page": 15
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                for row in resp.json().get("results", []):
                    employer = str(row.get("employer", "")).strip().upper()
                    if not employer or employer in (
                        "N/A", "NONE", "SELF", "SELF EMPLOYED", "SELF-EMPLOYED", 
                        "RETIRED", "NOT EMPLOYED", "UNEMPLOYED", "INFORMATION REQUESTED", 
                        "HOMEMAKER", "NULL", "REQUESTED", "STUDENT"
                    ):
                        continue
                    employer_totals[employer] += float(row.get("total") or 0.0)
        except Exception as ex:
            print(f"Error fetching employers for committee {comm_id}: {ex}")
            
    sorted_employers = sorted(employer_totals.items(), key=lambda x: x[1], reverse=True)[:10]
    return [
        DonorItem(name=name, amount=round(total, 2), contributors=[])
        for name, total in sorted_employers
    ]


def _get_independent_expenditures(fec_id: str, cycle: int) -> List[IndependentExpenditureItem]:
    """
    Fetches independent expenditures (spending by Super PACs / outside groups FOR or AGAINST the candidate).
    """
    if not FEC_API_KEY or not fec_id:
        return []

    expenditures = []
    try:
        url = f"https://api.open.fec.gov/v1/schedules/schedule_e/by_candidate/"
        params = {
            "api_key": FEC_API_KEY,
            "candidate_id": fec_id,
            "cycle": cycle,
            "per_page": 20,
            "sort": "-total"
        }
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code == 200:
            for row in resp.json().get("results", []):
                comm_name = row.get("committee_name") or "Outside Political Group"
                support_oppose = row.get("support_oppose_indicator") or "S"
                total_amt = float(row.get("total") or 0.0)
                if total_amt > 0:
                    expenditures.append(
                        IndependentExpenditureItem(
                            committee_name=comm_name.strip().title(),
                            support_or_oppose="SUPPORT" if support_oppose.upper() == "S" else "OPPOSE",
                            amount=round(total_amt, 2),
                            description=f"Outside independent expenditure in {cycle} election"
                        )
                    )
    except Exception as ex:
        print(f"Error fetching independent expenditures for {fec_id}: {ex}")

    return expenditures[:10]


def _get_itemized_pacs(committee_ids: List[str]):
    if not FEC_API_KEY or not committee_ids:
        return [], []

    pac_totals = defaultdict(float)
    super_pac_totals = defaultdict(float)

    for comm_id in committee_ids:
        try:
            url = "https://api.open.fec.gov/v1/schedules/schedule_a/"
            params = {
                "api_key": FEC_API_KEY,
                "committee_id": comm_id,
                "is_individual": "false",
                "per_page": 50,
                "sort": "-contribution_receipt_amount"
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                for row in resp.json().get("results", []):
                    raw_name = row.get("contributor_name") or "Unknown PAC"
                    amt = float(row.get("contribution_receipt_amount") or 0.0)
                    if amt <= 0:
                        continue

                    name = raw_name.strip().title()
                    name_upper = name.upper()

                    if any(kw in name_upper for kw in ("SUPER PAC", "ACTION", "VICTORY", "INDEPENDENT EXPENDITURE")):
                        super_pac_totals[name] += amt
                    else:
                        pac_totals[name] += amt
        except Exception as ex:
            print(f"Error fetching PACs for committee {comm_id}: {ex}")

    total_pac_sum = sum(pac_totals.values())
    total_super_pac_sum = sum(super_pac_totals.values())

    pacs = []
    for name, amt in sorted(pac_totals.items(), key=lambda x: x[1], reverse=True)[:10]:
        pct = (amt / total_pac_sum * 100.0) if total_pac_sum > 0 else 0.0
        pacs.append(PacItem(name=name, type="Traditional PAC", amount=round(amt, 2), percentage=round(pct, 1)))

    super_pacs = []
    for name, amt in sorted(super_pac_totals.items(), key=lambda x: x[1], reverse=True)[:10]:
        pct = (amt / total_super_pac_sum * 100.0) if total_super_pac_sum > 0 else 0.0
        super_pacs.append(PacItem(name=name, type="Super PAC / Action Fund", amount=round(amt, 2), percentage=round(pct, 1)))

    return pacs, super_pacs


# region Main Finance Service
def get_campaign_finance(bioguide_id: str) -> Dict[str, FinanceSummary]:
    global _finance_cache
    if bioguide_id in _finance_cache:
        return _finance_cache[bioguide_id]

    politician = next((p for p in load_congress_data() if p.id == bioguide_id), None)
    if not politician:
        return {}
        
    campaigns = {}
    
    if FEC_API_KEY:
        cand_ids = set(politician.fec_ids or [])
        if politician.fec_id:
            cand_ids.add(politician.fec_id)
            
        try:
            search_url = "https://api.open.fec.gov/v1/candidates/"
            search_params = {
                "api_key": FEC_API_KEY,
                "q": f"{politician.last_name}, {politician.first_name}"
            }
            search_resp = requests.get(search_url, params=search_params, timeout=5)
            if search_resp.status_code == 200:
                for cand in search_resp.json().get("results", []):
                    c_id = cand.get("candidate_id")
                    c_name = cand.get("name", "")
                    if c_id and politician.last_name.upper() in c_name.upper():
                        cand_ids.add(c_id)
        except Exception as ex:
            print(f"FEC candidate search failed: {ex}")
            
        metadata_map = {}
        if cand_ids:
            try:
                meta_url = "https://api.open.fec.gov/v1/candidates/"
                meta_params = {
                    "api_key": FEC_API_KEY,
                    "candidate_id": list(cand_ids)
                }
                meta_resp = requests.get(meta_url, params=meta_params, timeout=5)
                if meta_resp.status_code == 200:
                    for cand in meta_resp.json().get("results", []):
                        metadata_map[cand.get("candidate_id")] = {
                            "office_full": cand.get("office_full") or "Unknown",
                            "state": cand.get("state") or politician.state
                        }
            except Exception as ex:
                print(f"FEC metadata lookup failed: {ex}")
                
        grouped_totals = defaultdict(list)
        for fec_id in cand_ids:
            try:
                totals_url = f"https://api.open.fec.gov/v1/candidate/{fec_id}/totals/"
                params = {"api_key": FEC_API_KEY}
                resp = requests.get(totals_url, params=params, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    for res in results:
                        ey = res.get("candidate_election_year")
                        if ey:
                            grouped_totals[(fec_id, ey)].append(res)
            except Exception as ex:
                print(f"FEC totals request failed for candidate {fec_id}: {ex}")
                
        for (fec_id, ey), rows in grouped_totals.items():
            meta = metadata_map.get(fec_id, {"office_full": "Unknown", "state": politician.state})
            office = meta["office_full"]
            state = meta["state"]
            
            if office in ("Senate", "House"):
                label = f"{office} - {ey} Election ({state})"
            else:
                label = f"{office} - {ey} Campaign"
                
            summary_row = next((r for r in rows if r.get("cycle") is None), None)
            if summary_row:
                total_donations = float(summary_row.get("receipts") or 0.0)
                small_donations = float(summary_row.get("individual_unitemized_contributions") or 0.0)
                pac_donations = float(summary_row.get("other_political_committee_contributions") or 0.0)
            else:
                cycle_rows = [r for r in rows if r.get("cycle") is not None]
                total_donations = sum(float(r.get("receipts") or 0.0) for r in cycle_rows)
                small_donations = sum(float(r.get("individual_unitemized_contributions") or 0.0) for r in cycle_rows)
                pac_donations = sum(float(r.get("other_political_committee_contributions") or 0.0) for r in cycle_rows)
                
            if total_donations > 0:
                pct_small = (small_donations / total_donations) * 100.0
                pct_pac = (pac_donations / total_donations) * 100.0
                pct_super_pac = max(0.0, 100.0 - pct_small - pct_pac)
            else:
                pct_small = pct_pac = pct_super_pac = 0.0
                
            history = []
            cycle_rows = sorted([r for r in rows if r.get("cycle") is not None], key=lambda x: x.get("cycle"))
            if not cycle_rows and total_donations > 0:
                history.append(
                    FinanceHistoryItem(
                        cycle=str(ey),
                        small_donations=round(small_donations, 2),
                        pac_donations=round(pac_donations, 2),
                        super_pac_donations=round(max(0.0, total_donations - small_donations - pac_donations), 2)
                    )
                )
            else:
                for r in cycle_rows:
                    c_receipts = float(r.get("receipts") or 0.0)
                    c_small = float(r.get("individual_unitemized_contributions") or 0.0)
                    c_pac = float(r.get("other_political_committee_contributions") or 0.0)
                    c_super_pac = max(0.0, c_receipts - c_small - c_pac)
                    history.append(
                        FinanceHistoryItem(
                            cycle=str(r.get("cycle")),
                            small_donations=round(c_small, 2),
                            pac_donations=round(c_pac, 2),
                            super_pac_donations=round(c_super_pac, 2)
                        )
                    )
            
            committee_ids = _get_candidate_committees(fec_id)
            donors = _get_top_employers(committee_ids, ey)
            pacs, super_pacs = _get_itemized_pacs(committee_ids)
            independent_expenditures = _get_independent_expenditures(fec_id, ey)

            campaigns[label] = FinanceSummary(
                id=bioguide_id,
                candidate_id=fec_id,
                office=office,
                state=state,
                total_donations=round(total_donations, 2),
                small_donations_pct=round(pct_small, 1),
                pac_donations_pct=round(pct_pac, 1),
                super_pac_donations_pct=round(pct_super_pac, 1),
                history=history,
                donors=donors,
                pacs=pacs,
                super_pacs=super_pacs,
                independent_expenditures=independent_expenditures
            )
            
    _finance_cache[bioguide_id] = campaigns
    return campaigns
# endregion
