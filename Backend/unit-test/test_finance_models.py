import pytest
from models.finance import (
    FinanceSummary,
    FinanceHistoryItem,
    DonorItem,
    PacItem,
    TopDonorItem,
    IndustrySectorItem
)


def test_finance_history_item_validation():
    item = FinanceHistoryItem(
        cycle="2024",
        small_donations=50000.0,
        pac_donations=25000.0,
        super_pac_donations=10000.0
    )
    assert item.cycle == "2024"
    assert item.small_donations == 50000.0


def test_pac_item_default_values():
    pac = PacItem(
        name="Defenders of Democracy PAC",
        type="Super PAC",
        amount=150000.0
    )
    assert pac.percentage == 0.0
    assert pac.date is None
    assert pac.amount == 150000.0


def test_finance_summary_instantiation():
    summary = FinanceSummary(
        id="S000033",
        candidate_id="S000033",
        office="Senate",
        state="VT",
        total_donations=1250000.0,
        small_donations_pct=65.5,
        pac_donations_pct=20.0,
        super_pac_donations_pct=14.5,
        history=[
            FinanceHistoryItem(
                cycle="2024",
                small_donations=800000.0,
                pac_donations=250000.0,
                super_pac_donations=200000.0
            )
        ],
        donors=[DonorItem(name="Tech Workers for Transparency", amount=50000.0)],
        top_donors=[TopDonorItem(name="Individual Small Donors", total_amount=800000.0)]
    )
    assert summary.office == "Senate"
    assert len(summary.history) == 1
    assert len(summary.donors) == 1
    assert summary.small_donations_pct == 65.5
