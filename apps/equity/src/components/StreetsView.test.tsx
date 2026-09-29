import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import { StreetsView } from './StreetsView';

const streets = [
  { street: 'pre' as const, equity: [0.82, 0.18] },
  { street: 'flop' as const, equity: [0.91, 0.09] },
];

const axis = (container: HTMLElement) =>
  [...container.querySelectorAll('text.streets-axis')].map((t) => t.textContent).filter((s) => !/^\d+$/.test(s ?? ''));

afterEach(cleanup);

describe('StreetsView', () => {
  it.each([
    ['ja', ['プリフロップ', 'フロップ'], 'P1 フロップ 91.0%'],
    ['en', ['Pre', 'Flop'], 'P1 Flop 91.0%'],
  ] as const)('labels streets in %s', (locale, labels, tooltip) => {
    const { container } = render(
      <I18nProvider value={createTranslator(locale)}>
        <StreetsView streets={streets} players={2} />
      </I18nProvider>,
    );
    expect(axis(container)).toEqual(labels);
    expect([...container.querySelectorAll('title')].map((t) => t.textContent)).toContain(tooltip);
  });
});

describe('StreetsView axis labels', () => {
  it('keeps the first and last street labels inside the chart', () => {
    const { container } = render(<StreetsView streets={streets} players={2} />);
    const labels = [...container.querySelectorAll('text.streets-axis')].filter((t) => !/^\d+$/.test(t.textContent ?? ''));
    expect(labels.map((t) => t.getAttribute('text-anchor'))).toEqual(['start', 'end']);
  });

  it('centres a single street label', () => {
    const { container } = render(<StreetsView streets={streets.slice(0, 1)} players={2} />);
    const labels = [...container.querySelectorAll('text.streets-axis')].filter((t) => !/^\d+$/.test(t.textContent ?? ''));
    expect(labels.map((t) => t.getAttribute('text-anchor'))).toEqual(['middle']);
  });
});
