import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

afterEach(cleanup);

describe('SettingsPanel', () => {
  it('changes theme, language and four-color deck', () => {
    const onChange = vi.fn();
    const settings = { theme: 'felt' as const, locale: 'ja' as const, fourColor: false };
    render(<SettingsPanel settings={settings} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'ダーク' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, theme: 'dark' });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, locale: 'en' });
    fireEvent.click(screen.getByRole('switch', { name: '4色デッキ' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, fourColor: true });
  });
});
