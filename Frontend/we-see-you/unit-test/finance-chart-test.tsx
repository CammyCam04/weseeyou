import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FinanceChart from '../components/templates/finance-chart/finance-chart';
import { FinanceSummary } from '@/lib/api';

const mockCampaigns: Record<string, FinanceSummary> = {
  "House - 2026 Election (TN)": {
    id: "F000459",
    candidate_id: "H0TN03254",
    office: "House",
    state: "TN",
    total_donations: 2651280.32,
    small_donations_pct: 0.2,
    pac_donations_pct: 10.4,
    super_pac_donations_pct: 89.4,
    history: [
      {
        cycle: "2026",
        small_donations: 4395.04,
        pac_donations: 276113.36,
        super_pac_donations: 2370505.35
      }
    ],
    donors: [],
    top_donors: [],
    pacs: [
      { name: "Regions Bank", type: "Traditional PAC", amount: 171113.36, percentage: 57.8 },
      { name: "PAC 2", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 3", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 4", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 5", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 6", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 7", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 8", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 9", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 10", type: "Traditional PAC", amount: 10000.0, percentage: 3.4 },
      { name: "PAC 11", type: "Traditional PAC", amount: 5000.0, percentage: 1.7 },
      { name: "PAC 12", type: "Traditional PAC", amount: 5000.0, percentage: 1.7 }
    ],
    super_pacs: [
      { name: "Senate Leadership Fund", type: "Super PAC / Independent Fund", amount: 530273.33, percentage: 22.9 },
      { name: "American Action Network", type: "501(c)(4) / Independent Expenditure", amount: 251736.07, percentage: 10.9 }
    ],
    industry_sectors: [],
    independent_expenditures: []
  },
  "Senate - 2024 Election (TN)": {
    id: "F000459",
    candidate_id: "S0TN03254",
    office: "Senate",
    state: "TN",
    total_donations: 5000000.00,
    small_donations_pct: 20.0,
    pac_donations_pct: 30.0,
    super_pac_donations_pct: 50.0,
    history: [
      {
        cycle: "2024",
        small_donations: 1000000.00,
        pac_donations: 1500000.00,
        super_pac_donations: 2500000.00
      }
    ],
    donors: [],
    top_donors: [],
    pacs: [
      { name: "Defense PAC", type: "Traditional PAC", amount: 500000.00, percentage: 33.3 }
    ],
    super_pacs: [
      { name: "Majority Action PAC", type: "Super PAC", amount: 2000000.00, percentage: 80.0 }
    ],
    industry_sectors: [],
    independent_expenditures: []
  }
};

describe('FinanceChart Component', () => {
  it('renders campaign metrics and outside funds breakdown', () => {
    render(<FinanceChart campaigns={mockCampaigns} currentChamber="House" />);

    expect(screen.getByText('Super PAC & Outside Funds')).toBeDefined();
    expect(screen.getByText('Traditional PAC Direct')).toBeDefined();
    expect(screen.getByText('Individual & Grassroots')).toBeDefined();
  });

  it('limits PAC listing to 10 items initially and provides expand option', () => {
    render(<FinanceChart campaigns={mockCampaigns} currentChamber="House" />);

    expect(screen.getByText('View All 14')).toBeDefined();
    expect(screen.queryByText('PAC 12')).toBeNull();

    const expandBtn = screen.getByText('View All 14');
    fireEvent.click(expandBtn);

    expect(screen.getByText('PAC 12')).toBeDefined();
    expect(screen.getByText('Show Top 10')).toBeDefined();
  });

  it('labels 501(c)(4) independent expenditures as Outside Funds', () => {
    render(<FinanceChart campaigns={mockCampaigns} currentChamber="House" />);

    expect(screen.getByText('American Action Network')).toBeDefined();
    expect(screen.getByText('501(c)(4) Outside')).toBeDefined();
  });

  it('switches to Complete Career History lifetime totals on the Donut graph', () => {
    render(<FinanceChart campaigns={mockCampaigns} currentChamber="House" />);

    const completeCareerBtn = screen.getByText('Complete Career History');
    fireEvent.click(completeCareerBtn);

    // Career lifetime total label should appear in the Donut center
    expect(screen.getByText('Career Lifetime Total')).toBeDefined();
    expect(screen.getByText('Itemized Career Lifetime PAC & Outside Spending Contributions (Complete Career)')).toBeDefined();
  });
});
