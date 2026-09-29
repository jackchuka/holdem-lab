import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CATEGORIES } from '@holdem-lab/quiz';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import { createMemoryStore } from '../storage/store';
import { defaultSettings } from '../types';
import { Home } from './Home';

afterEach(cleanup);

describe('Home', () => {
  it('shows the app icon next to the title', () => {
    const { getByRole } = render(
      <I18nProvider value={createTranslator('ja')}>
        <Home store={createMemoryStore()} settings={defaultSettings()} available={CATEGORIES} onSettings={() => {}} onStart={() => {}} />
      </I18nProvider>,
    );
    const heading = getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Flashcards');
    const icon = heading.querySelector('img');
    expect(icon?.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}icon.svg`);
    expect(icon?.getAttribute('alt')).toBe('');
  });
});
