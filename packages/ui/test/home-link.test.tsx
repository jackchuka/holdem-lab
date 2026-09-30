import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeLink } from '../src';

describe('HomeLink', () => {
  it('links to the home page under the brand name with the logo drawn inline', () => {
    render(<HomeLink href="../" />);
    const link = screen.getByRole('link', { name: 'holdem-lab' });
    expect(link.getAttribute('href')).toBe('../');
    expect(link.querySelector('svg')).not.toBeNull();
    expect(link.querySelector('img')).toBeNull();
  });
});
