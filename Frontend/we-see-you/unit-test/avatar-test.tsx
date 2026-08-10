import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Avatar from '../components/templates/avatar/avatar';

describe('Avatar Component', () => {
  it('renders initials when no image src is provided', () => {
    render(<Avatar firstName="Bernie" lastName="Sanders" />);
    expect(screen.getByText('BS')).toBeDefined();
  });

  it('renders image element with alt text when src is provided', () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        firstName="Alexandria"
        lastName="Ocasio-Cortez"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('alt')).toBe('Alexandria Ocasio-Cortez');
  });

  it('handles empty first or last name gracefully', () => {
    render(<Avatar firstName="Plato" lastName="" />);
    expect(screen.getByText('P')).toBeDefined();
  });
});
