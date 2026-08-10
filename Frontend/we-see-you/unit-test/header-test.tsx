import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from '../components/templates/header/header';

describe('Header Component', () => {
  it('renders branding title and subtitle', () => {
    render(<Header activeTab="national" />);
    expect(screen.getByText('We See You')).toBeDefined();
    expect(screen.getByText('Political Transparency Portal')).toBeDefined();
  });

  it('renders standard navigation links', () => {
    render(<Header activeTab="national" />);
    expect(screen.getByText('National')).toBeDefined();
    expect(screen.getByText('State')).toBeDefined();
    expect(screen.getByText('County / Municipal')).toBeDefined();
    expect(screen.getByText('About & Methodology')).toBeDefined();
  });

  it('triggers onTabChange callback when navigation item is clicked', () => {
    const handleTabChange = vi.fn();
    render(<Header activeTab="national" onTabChange={handleTabChange} />);
    
    const stateLink = screen.getByText('State');
    fireEvent.click(stateLink);
    
    expect(handleTabChange).toHaveBeenCalledWith('state');
  });
});
