import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./scene/webgl', () => ({ hasWebGL: () => true }));
vi.mock('./scene/Scene', () => ({
  Scene: () => {
    throw new Error('Error creating WebGL context.');
  },
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('holdem-lab:chips:settings', JSON.stringify({ locale: 'ja' }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(cleanup);

it('falls back to captions when the 3D scene fails to start', () => {
  render(<App autoplay={false} />);
  expect(screen.getByText(/3D を表示できません/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '次のステップ' }));
  expect(screen.getByTestId('caption').textContent).toContain('2/4');
});
