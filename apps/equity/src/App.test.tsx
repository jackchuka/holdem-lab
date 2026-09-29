import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptyStats, parseCards } from '@holdem-lab/engine';
import { App } from './App';
import { createCoordinator, type Coordinator } from './compute/coordinator';
import { createInlineWorker } from './compute/worker-core';
import { initialState, type AppState } from './state';

const partial = (mode: 'exact' | 'mc'): Coordinator => ({
  run: (_job, onUpdate) => {
    const timer = setTimeout(() => onUpdate({ stats: { ...emptyStats(2), samples: 10, share: [8, 2] }, mode, done: false }));
    return () => clearTimeout(timer);
  },
  dispose: () => {},
});
const coordinator = () => createCoordinator({ createWorker: createInlineWorker, workerCount: 1 });

beforeEach(() => {
  localStorage.setItem('holdem-lab:equity:settings', JSON.stringify({ locale: 'ja' }));
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('App', () => {
  it('computes equity for two hands and writes the URL', async () => {
    const initial = { ...initialState(), board: parseCards('9s8s2d7h') };
    render(<App coordinator={coordinator()} presets={null} initial={initial} badUrl={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'P1 を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'A♠' }));
    fireEvent.click(screen.getByRole('button', { name: 'K♠' }));
    fireEvent.click(screen.getByRole('button', { name: 'P2 を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'Q♥' }));
    fireEvent.click(screen.getByRole('button', { name: 'Q♦' }));
    expect(await screen.findByText('正確な値', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByTestId('equity-0').textContent).toMatch(/^\d+\.\d%$/);
    expect(window.location.search).toContain('p=AsKs');
  });

  it('adds and removes players', () => {
    render(<App coordinator={coordinator()} presets={null} initial={initialState()} badUrl={false} />);
    fireEvent.click(screen.getByRole('button', { name: '＋ プレイヤー' }));
    expect(screen.getByRole('button', { name: 'P3 を編集' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'P3 を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'このプレイヤーを削除' }));
    expect(screen.queryByRole('button', { name: 'P3 を編集' })).toBeNull();
  });

  it('explains why nothing is calculated yet', () => {
    render(<App coordinator={coordinator()} presets={null} initial={initialState()} badUrl={false} />);
    expect(screen.getByText('ハンドとボードを入力すると計算します')).toBeTruthy();
  });

  it('tells the user when the URL could not be restored', () => {
    render(<App coordinator={coordinator()} presets={null} initial={initialState()} badUrl />);
    expect(screen.getByRole('status').textContent).toContain('URL を読み込めなかったため、初期状態で開きました');
  });

  it('opens settings from the header', () => {
    render(<App coordinator={coordinator()} presets={null} initial={initialState()} badUrl={false} />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(screen.getByRole('dialog', { name: '設定' })).toBeTruthy();
  });

  it('hides partial exact equities until the enumeration finishes', async () => {
    const initial: AppState = {
      board: parseCards('9s8s2d'),
      players: [
        { kind: 'hand', cards: parseCards('AsAh') },
        { kind: 'hand', cards: parseCards('KsKh') },
      ],
      focus: 0,
    };
    const settle = () => act(() => new Promise((r) => setTimeout(r, 400)));
    render(<App coordinator={partial('mc')} presets={null} initial={initial} badUrl={false} />);
    await settle();
    expect(screen.getByTestId('equity-0').textContent).toBe('80.0%');
    cleanup();
    render(<App coordinator={partial('exact')} presets={null} initial={initial} badUrl={false} />);
    await settle();
    expect(screen.getByTestId('equity-0').textContent).toBe('—');
    expect(screen.getByText('計算中…')).toBeTruthy();
    expect(screen.getByText('計算が終わると表示')).toBeTruthy();
  });
});
