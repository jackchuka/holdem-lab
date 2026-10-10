import { expect, test, type Page } from '@playwright/test';

const tab = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('swiping follows the tabs and a tab scrolls to its app @mobile', async ({ page }) => {
  await page.goto('/');
  await expect(tab(page, 'Fortune')).toHaveAttribute('aria-current', 'true');
  await tab(page, 'Equity').click();
  await expect(page.locator('#app-equity .shot')).toBeInViewport({ ratio: 0.9 });
  await expect(tab(page, 'Equity')).toHaveAttribute('aria-current', 'true');

  // A swipe starts with a touch on the rail, which hands the tabs back to the scroll position.
  await page.locator('#rail').dispatchEvent('pointerdown');
  await page.locator('#rail').evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
  await expect(tab(page, 'Fortune')).toHaveAttribute('aria-current', 'true');
});

test('switches the language and remembers it @mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tagline')).toHaveText('ホールデムを、覚えて・計算して・遊ぶ', { useInnerText: true });
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.locator('.tagline')).toHaveText("Learn, calculate and play Hold'em", { useInnerText: true });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('#app-equity .short')).toHaveText('Hand and range equity calculator', { useInnerText: true });
});

test('shows one app at a time and switches with tabs and arrow keys @desktop', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app-fortune')).toBeVisible();
  await expect(page.locator('#app-equity')).toBeHidden();
  await expect(page.locator('#app-fortune .lead')).toBeVisible();

  await tab(page, 'Equity').click();
  await expect(page.locator('#app-equity')).toBeVisible();
  await expect(page.locator('#app-fortune')).toBeHidden();
  await expect(page.locator('#app-equity .open')).toHaveAttribute('href', 'http://localhost:5174/');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#app-chips')).toBeVisible();
  await expect(tab(page, 'Chips')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#app-chips')).toBeVisible();
});

test('keeps the chosen app when the window narrows to phone width @desktop', async ({ page }) => {
  await page.goto('/');
  await tab(page, 'Chips').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#app-chips .shot')).toBeInViewport({ ratio: 0.9 });
  await expect(tab(page, 'Chips')).toHaveAttribute('aria-current', 'true');
});

test('keeps the tapped app at tablet width, where the last cards cannot reach the left edge @desktop', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await tab(page, 'Chips').click();
  await expect(page.locator('#app-chips .shot')).toBeInViewport({ ratio: 0.9 });
  await page.waitForTimeout(600);
  await expect(tab(page, 'Chips')).toHaveAttribute('aria-current', 'true');
});

test('keeps the chosen app through wide, tablet and wide again @desktop', async ({ page }) => {
  await page.goto('/');
  await tab(page, 'Chips').click();
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForTimeout(600);
  await expect(tab(page, 'Chips')).toHaveAttribute('aria-current', 'true');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('#app-chips')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('lists every app with links and no dead controls @desktop', async ({ page }) => {
    await page.goto('/');
    for (const id of ['fortune', 'flashcards', 'glossary', 'equity', 'chips']) {
      await expect(page.locator(`#app-${id} h2 a`)).toBeVisible();
    }
    await expect(page.locator('#tabs')).toBeHidden();
    await expect(page.locator('#lang')).toBeHidden();
    await expect(page.locator('.tagline')).toHaveText('ホールデムを、覚えて・計算して・遊ぶ', { useInnerText: true });
  });
});
