export function stepIndex(current: number, key: string, count: number): number {
  const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return Math.min(count - 1, Math.max(0, current + step));
}

export function visibleIndex(scrollLeft: number, stride: number, count: number): number {
  if (stride <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / stride)));
}

type Span = { left: number; right: number };

export function isFullyVisible(item: Span, view: Span): boolean {
  return item.left >= view.left - 1 && item.right <= view.right + 1;
}

// On narrow screens the rail scrolls and the tabs follow it; on wide screens (stage) the tabs pick the one app shown.
export function mountCarousel(rail: HTMLElement, tabs: HTMLElement, stage: MediaQueryList, reduceMotion: MediaQueryList): void {
  const items = [...rail.querySelectorAll<HTMLElement>('article.app')];
  const buttons = [...tabs.querySelectorAll<HTMLButtonElement>('button.tab')];
  let current = 0;
  // While we scroll the rail to a chosen app, its scroll position says nothing about the choice; a touch hands control back.
  let pinned = false;

  const reveal = (smooth: boolean) => {
    if (stage.matches) return;
    pinned = true;
    items[current].scrollIntoView({ behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto', block: 'nearest', inline: 'start' });
  };
  const select = (i: number) => {
    current = i;
    buttons.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    items.forEach((it, j) => it.toggleAttribute('data-active', j === i));
  };

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      select(i);
      reveal(true);
    }),
  );
  tabs.addEventListener('keydown', (e) => {
    const next = stepIndex(current, e.key, items.length);
    if (next === current) return;
    e.preventDefault();
    select(next);
    reveal(true);
    buttons[next].focus();
  });
  rail.addEventListener(
    'scroll',
    () => {
      if (stage.matches || pinned || items.length < 2) return;
      // Near the end of a wide rail the last cards cannot reach the left edge, so keep a choice that is still fully in view.
      if (isFullyVisible(items[current].getBoundingClientRect(), rail.getBoundingClientRect())) return;
      const i = visibleIndex(rail.scrollLeft, items[1].offsetLeft - items[0].offsetLeft, items.length);
      if (i !== current) select(i);
    },
    { passive: true },
  );
  for (const type of ['pointerdown', 'touchstart', 'wheel']) rail.addEventListener(type, () => (pinned = false), { passive: true });
  // Leaving the stage layout puts the rail back at its old scroll position, so bring the chosen app into view.
  stage.addEventListener('change', () => reveal(false));
  select(0);
}
