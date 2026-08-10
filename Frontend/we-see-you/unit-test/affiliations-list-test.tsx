import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AffiliationsList from '../components/templates/affiliations-list/affiliations-list';

describe('AffiliationsList Component', () => {
  it('renders parsed committee names and roles', () => {
    const items = [
      'Committee SSBU -- Senate Committee on the Budget (Chairman)',
      'Committee SSFR -- Senate Committee on Foreign Relations'
    ];

    render(<AffiliationsList items={items} />);

    expect(screen.getByText('Senate Committee on the Budget')).toBeDefined();
    expect(screen.getByText('Chairman')).toBeDefined();
    expect(screen.getByText('Senate Committee on Foreign Relations')).toBeDefined();
  });

  it('renders empty message or nothing gracefully when items array is empty', () => {
    const { container } = render(<AffiliationsList items={[]} />);
    expect(container.textContent).toContain('No affiliations recorded');
  });
});
