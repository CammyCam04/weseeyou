import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PreviewCardTemplate from '../components/templates/preview-card-template/preview-card-template';
import { prefetchPolitician } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  prefetchPolitician: vi.fn(),
}));

describe('PreviewCardTemplate Component', () => {
  it('renders politician full name, title, state, and party badge', () => {
    render(
      <PreviewCardTemplate
        id="S000033"
        firstName="Bernie"
        lastName="Sanders"
        title="U.S. Senator"
        state="VT"
        party="I"
      />
    );

    expect(screen.getByText('Bernie Sanders')).toBeDefined();
    expect(screen.getByText('U.S. Senator')).toBeDefined();
    expect(screen.getByText('VT')).toBeDefined();
    expect(screen.getByText('Independent')).toBeDefined();
  });

  it('renders correct party label for Democrat and Republican', () => {
    const { rerender } = render(
      <PreviewCardTemplate
        id="D001"
        firstName="Jane"
        lastName="Doe"
        title="Representative"
        party="D"
      />
    );
    expect(screen.getByText('Democrat')).toBeDefined();

    rerender(
      <PreviewCardTemplate
        id="R001"
        firstName="John"
        lastName="Smith"
        title="Senator"
        party="R"
      />
    );
    expect(screen.getByText('Republican')).toBeDefined();
  });

  it('calls onSelect callback with politician id when clicked', () => {
    const handleSelect = vi.fn();
    render(
      <PreviewCardTemplate
        id="S000033"
        firstName="Bernie"
        lastName="Sanders"
        title="U.S. Senator"
        party="I"
        onSelect={handleSelect}
      />
    );

    const card = screen.getByRole('link');
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledWith('S000033');
  });

  it('triggers prefetch on mouseEnter, pointerDown, and touchStart', () => {
    vi.clearAllMocks();
    render(
      <PreviewCardTemplate
        id="S000033"
        firstName="Bernie"
        lastName="Sanders"
        title="U.S. Senator"
        party="I"
      />
    );

    const card = screen.getByRole('link');
    fireEvent.pointerDown(card);
    expect(prefetchPolitician).toHaveBeenCalledWith('S000033');

    fireEvent.touchStart(card);
    expect(prefetchPolitician).toHaveBeenCalledWith('S000033');

    fireEvent.mouseEnter(card);
    expect(prefetchPolitician).toHaveBeenCalledWith('S000033');
  });
});
