import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, type View } from './App';
import { REVEAL_STEP_MS } from './components/Reveal';
import { computeFortune } from './fortune';
import { createTranslator } from './i18n/i18n';
import { createStore, type KeyValue } from './store';

const TODAY = '2026-09-30';
const { t } = createTranslator('ja');

function memory(): KeyValue {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

function setup(opts: { initial?: View; seen?: boolean; badUrl?: boolean; reducedMotion?: boolean; clock?: () => string; savedName?: string } = {}) {
  const store = createStore(memory(), () => '0123456789abcdef');
  if (opts.seen) store.markSeen(TODAY);
  if (opts.savedName) store.setSavedName(opts.savedName);
  const initial = opts.initial ?? { key: { kind: 'device', id: store.deviceId() }, date: TODAY, source: 'mine' };
  const open = vi.fn();
  render(
    <App store={store} today={opts.clock ?? (() => TODAY)} initial={initial} badUrl={opts.badUrl ?? false} reducedMotion={opts.reducedMotion ?? false} nav={{}} open={open} />,
  );
  return { store, open };
}

const tierText = (key: View['key']) => t(`tier.${computeFortune(key, TODAY).tier}`);

beforeEach(() => {
  localStorage.setItem('holdem-lab:fortune:settings', JSON.stringify({ locale: 'ja' }));
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('reveals the fortune card by card on the first visit of the day', () => {
    const { store } = setup();
    expect(screen.getAllByTestId('card-back')).toHaveLength(7);
    fireEvent.click(screen.getByRole('button', { name: '運勢を見る' }));
    expect(store.seenToday(TODAY)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(REVEAL_STEP_MS * 4);
    });
    expect(screen.queryAllByTestId('card-back')).toHaveLength(0);
    expect(screen.getByTestId('tier').textContent).toBe(tierText({ kind: 'device', id: '0123456789abcdef' }));
  });

  it('skips the animation when already seen today or with reduced motion', () => {
    setup({ seen: true });
    expect(screen.queryByRole('button', { name: '運勢を見る' })).toBeNull();
    expect(screen.getByTestId('tier')).toBeTruthy();
  });

  it('shows the result at once when reduced motion is requested', () => {
    setup({ reducedMotion: true });
    fireEvent.click(screen.getByRole('button', { name: '運勢を見る' }));
    expect(screen.getByTestId('tier')).toBeTruthy();
  });

  it('links to Equity with the dealt cards', () => {
    setup({ seen: true });
    const href = screen.getByRole('link', { name: 'Equity で検証' }).getAttribute('href')!;
    expect(href).toMatch(/^\.\.\/equity\/\?b=/);
    const q = new URLSearchParams(href.split('?')[1]);
    expect(q.get('b')).toHaveLength(10);
    expect(q.getAll('p')).toEqual([expect.stringMatching(/^[2-9TJQKA][shdc][2-9TJQKA][shdc]$/), 'x']);
  });

  it('reads a fortune by name, saves it, edits it and clears it', () => {
    const { store } = setup({ seen: true });
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: 'Taro' } });
    fireEvent.click(screen.getByRole('button', { name: '占う' }));
    expect(screen.getByText(/taro さんの/)).toBeTruthy();
    expect(screen.getByTestId('tier').textContent).toBe(tierText({ kind: 'name', name: 'taro' }));
    expect(store.seenToday(TODAY)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'この名前を自分の運勢にする' }));
    expect(store.savedName()).toBe('taro');
    expect(screen.getByText('保存名: taro')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '変更' }));
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: 'Hanako' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(store.savedName()).toBe('hanako');
    expect(screen.getByTestId('tier').textContent).toBe(tierText({ kind: 'name', name: 'hanako' }));

    fireEvent.click(screen.getByRole('button', { name: '解除' }));
    expect(store.savedName()).toBeNull();
    expect(screen.getByTestId('tier').textContent).toBe(tierText({ kind: 'device', id: '0123456789abcdef' }));
  });

  it('goes back to my fortune from a name', () => {
    setup({ seen: true });
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: 'Taro' } });
    fireEvent.click(screen.getByRole('button', { name: '占う' }));
    fireEvent.click(screen.getByRole('button', { name: '自分の運勢に戻す' }));
    expect(screen.getByText(/の運勢$/).textContent).not.toContain('さんの');
  });

  it('disables the name button for blank input', () => {
    setup({ seen: true });
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: '占う' })).toHaveProperty('disabled', true);
  });

  it('shows a shared fortune with a button to see mine', () => {
    setup({ initial: { key: { kind: 'device', id: 'ffffffffffffffff' }, date: '2026-09-28', source: 'shared' } });
    expect(screen.getByText(/シェアされた/)).toBeTruthy();
    expect(screen.getByTestId('tier')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '自分の運勢を見る' }));
    expect(screen.getByRole('button', { name: '運勢を見る' })).toBeTruthy();
  });

  it('rolls over to the new day when the tab comes back after midnight', () => {
    let now = TODAY;
    setup({ seen: true, clock: () => now });
    expect(screen.queryByRole('button', { name: '運勢を見る' })).toBeNull();
    now = '2026-10-01';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByRole('button', { name: '運勢を見る' })).toBeTruthy();
    expect(screen.getByText(/10\/1/)).toBeTruthy();
  });

  it('rejects names that grow past the limit after normalization', () => {
    setup({ seen: true });
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: '㍿'.repeat(7) } });
    expect(screen.getByRole('button', { name: '占う' })).toHaveProperty('disabled', true);
  });

  it('drops the shared link parameters once I read, save or clear a name', () => {
    for (const action of ['read', 'save', 'clear'] as const) {
      history.replaceState(null, '', '/?k=uffffffffffffffff&d=2026-09-28');
      setup({
        initial: { key: { kind: 'device', id: 'ffffffffffffffff' }, date: '2026-09-28', source: 'shared' },
        savedName: action === 'clear' ? 'taro' : undefined,
      });
      if (action === 'clear') {
        fireEvent.click(screen.getByRole('button', { name: '解除' }));
      } else {
        fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: 'Taro' } });
        fireEvent.click(screen.getByRole('button', { name: '占う' }));
        if (action === 'save') fireEvent.click(screen.getByRole('button', { name: 'この名前を自分の運勢にする' }));
      }
      expect(location.search, action).toBe('');
      cleanup();
    }
  });

  it('returns to the unrevealed card backs after clearing a saved name before revealing', () => {
    setup();
    fireEvent.change(screen.getByLabelText('名前で占う'), { target: { value: 'Taro' } });
    fireEvent.click(screen.getByRole('button', { name: '占う' }));
    fireEvent.click(screen.getByRole('button', { name: 'この名前を自分の運勢にする' }));
    fireEvent.click(screen.getByRole('button', { name: '解除' }));
    expect(screen.getByRole('button', { name: '運勢を見る' })).toBeTruthy();
    expect(screen.getAllByTestId('card-back')).toHaveLength(7);
  });

  it('shows a toast for a broken link', () => {
    setup({ badUrl: true });
    expect(screen.getByRole('status').textContent).toContain('リンクを読み込めなかった');
  });

  it('falls back to the X intent and offers the image download on desktop', async () => {
    const { open } = setup({ seen: true });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'シェア' })));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/x\.com\/intent\/post\?text=/));
  });
});
