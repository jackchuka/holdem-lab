import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyReview } from '../srs/schedule';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import { createMemoryStore, type Store } from '../storage/store';
import { defaultSettings, type Settings } from '../types';
import { SettingsScreen } from './Settings';

const settings: Settings = { ...defaultSettings(), locale: 'ja' };

async function seededStore(): Promise<Store> {
  const store = createMemoryStore();
  await store.putReview(applyReview(undefined, 'po:bet-50', 'potodds', 'good', new Date()));
  await store.addHistory({ itemKey: 'po:bet-50', category: 'potodds', kind: 'new', correct: true, elapsedMs: 900, at: 1 });
  return store;
}

const renderSettings = (store: Store, onSettings = vi.fn()) =>
  render(
    <I18nProvider value={createTranslator('ja')}>
      <SettingsScreen store={store} settings={settings} rangeSet={null} onSettings={onSettings} onImported={() => {}} />
    </I18nProvider>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SettingsScreen reset', () => {
  it('does nothing when the confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const store = await seededStore();
    const { getByText } = renderSettings(store);
    fireEvent.click(getByText('学習データをすべて消す'));
    await Promise.resolve();
    expect(await store.getHistory(0)).toHaveLength(1);
    expect(await store.getReviews()).toHaveLength(1);
  });

  it('clears only history for the stats reset', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const store = await seededStore();
    const { getByText, findByText } = renderSettings(store);
    fireEvent.click(getByText('統計をリセット'));
    await findByText('リセットしました');
    expect(await store.getHistory(0)).toEqual([]);
    expect(await store.getReviews()).toHaveLength(1);
  });

  it('clears history and reviews for the full reset', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const store = await seededStore();
    const { getByText } = renderSettings(store);
    fireEvent.click(getByText('学習データをすべて消す'));
    await waitFor(async () => expect(await store.getReviews()).toEqual([]));
    expect(await store.getHistory(0)).toEqual([]);
  });
});

describe('SettingsScreen controls', () => {
  it('uses chips for small option sets', async () => {
    const onSettings = vi.fn();
    const { getByRole } = renderSettings(createMemoryStore(), onSettings);
    expect(getByRole('button', { name: '日本語' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(getByRole('button', { name: 'English' }));
    expect(onSettings).toHaveBeenLastCalledWith({ ...settings, locale: 'en' });
    fireEvent.click(getByRole('button', { name: '±10%' }));
    expect(onSettings).toHaveBeenLastCalledWith({ ...settings, tolerance: 10 });
  });

  it('uses a switch for the four-color deck', () => {
    const onSettings = vi.fn();
    const { getByRole } = renderSettings(createMemoryStore(), onSettings);
    const toggle = getByRole('switch', { name: '4色デッキ' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(onSettings).toHaveBeenLastCalledWith({ ...settings, fourColor: true });
  });
});
