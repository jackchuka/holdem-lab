import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

// jsdom reports an English browser; pin Japanese so captions match the Japanese copy.
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('holdem-lab:chips:settings', JSON.stringify({ locale: 'ja' }));
});
afterEach(cleanup);

describe('App', () => {
  const caption = () => screen.getByTestId('caption').textContent;

  it('switches language from the settings sheet and remembers it', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('holdem-lab:chips:settings')!).locale).toBe('en');
  });

  it('shows a fallback without WebGL and still steps through captions', () => {
    render(<App autoplay={false} />);
    expect(screen.getByText(/3D を表示できません/)).toBeTruthy();
    expect(caption()).toContain('1/4');
    fireEvent.click(screen.getByRole('button', { name: '次のステップ' }));
    expect(caption()).toContain('2/4');
    expect(caption()).toContain('いちばん奥のチップの後ろ');
    fireEvent.click(screen.getByRole('button', { name: '前のステップ' }));
    fireEvent.click(screen.getByRole('button', { name: '前のステップ' }));
    expect(caption()).toContain('4/4');
  });

  it('keeps the last step when seeking to the very end', () => {
    render(<App autoplay={false} />);
    fireEvent.change(screen.getByRole('slider', { name: '再生位置' }), { target: { value: '2' } });
    expect(caption()).toContain('4/4');
  });

  it('translates the current caption when the language changes', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '次のステップ' }));
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(caption()).toContain('2/4');
    expect(caption()).toContain('behind the far chip');
  });

  it('saves speed, view and mirror', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '0.5×' }));
    fireEvent.click(screen.getByRole('button', { name: '向かい' }));
    fireEvent.click(screen.getByRole('button', { name: /左右反転/ }));
    expect(JSON.parse(localStorage.getItem('holdem-lab:chips:settings')!)).toMatchObject({ speed: 0.5, view: 'opposite', mirror: true });
  });

  it('switches tricks from the start and remembers the choice', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '次のステップ' }));
    fireEvent.click(screen.getByRole('tab', { name: 'リフル' }));
    expect(caption()).toContain('1/5');
    expect(caption()).toContain('2つの山');
    expect(JSON.parse(localStorage.getItem('holdem-lab:chips:settings')!).trick).toBe('riffle');
  });

  it('offers a diagonal view', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '斜め' }));
    expect(JSON.parse(localStorage.getItem('holdem-lab:chips:settings')!).view).toBe('diagonal');
  });

  it('toggles play and pause', () => {
    render(<App autoplay={false} />);
    fireEvent.click(screen.getByRole('button', { name: '再生' }));
    expect(screen.getByRole('button', { name: '一時停止' })).toBeTruthy();
  });
});
