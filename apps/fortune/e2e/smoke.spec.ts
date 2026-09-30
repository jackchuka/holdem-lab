import { expect, test } from '@playwright/test';

test('reveals, remembers the day and links to Equity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '運勢を見る' }).click();
  const tier = page.getByTestId('tier');
  await expect(tier).toBeVisible({ timeout: 5000 });
  const first = await tier.textContent();
  await expect(page.getByRole('link', { name: 'Equity で検証' })).toHaveAttribute('href', /^\.\.\/equity\/\?b=([2-9TJQKA][shdc]){5}&p=([2-9TJQKA][shdc]){2}&p=x$/);

  await page.reload();
  await expect(page.getByRole('button', { name: '運勢を見る' })).toHaveCount(0);
  await expect(page.getByTestId('tier')).toHaveText(first!);
});

test('shares an image and the link reproduces the fortune', async ({ page, context }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared?: unknown };
    Object.assign(navigator, {
      canShare: () => true,
      share: async (d: ShareData) => {
        w.__shared = { text: d.text, url: d.url, files: (d.files ?? []).map((f) => f.type) };
      },
    });
  });
  await page.goto('/');
  await page.getByLabel('名前で占う').fill('たろう');
  await page.getByRole('button', { name: '占う' }).click();
  const tier = await page.getByTestId('tier').textContent();
  await page.getByRole('button', { name: 'シェア' }).click();
  const shared = await page.waitForFunction(() => (window as unknown as { __shared?: unknown }).__shared).then((h) => h.jsonValue());
  const { url, files, text } = shared as { url: string; files: string[]; text: string };
  expect(files).toEqual(['image/png']);
  expect(text).toContain(tier!);
  expect(url).toMatch(/\?k=n%E3%81%9F%E3%82%8D%E3%81%86&d=\d{4}-\d{2}-\d{2}$/);

  const other = await context.newPage();
  await other.goto(url.replace(/^https?:\/\/[^/]+/, ''));
  await expect(other.getByText(/たろう さんの/)).toBeVisible();
  await expect(other.getByTestId('tier')).toHaveText(tier!);
  await expect(other.getByRole('button', { name: '自分の運勢を見る' })).toBeVisible();
});

test('opens my fortune with a notice on a broken link', async ({ page }) => {
  await page.goto('/?k=zzz&d=2999-01-01');
  await expect(page.getByRole('status')).toContainText('リンクを読み込めなかった');
  await expect(page.getByRole('button', { name: '運勢を見る' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
