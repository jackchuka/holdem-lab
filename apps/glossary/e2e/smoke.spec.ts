import { expect, test } from '@playwright/test';

test('flips a card and moves to the next one', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('position')).toHaveText('1 / 100');
  await page.getByTestId('card').click();
  await expect(page.getByTestId('card-back')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: '次へ' }).click();
  await expect(page.getByTestId('position')).toHaveText('2 / 100');
  await expect(page.getByTestId('card-back')).toHaveAttribute('aria-hidden', 'true');
});

test('finds 3-bet in the list and opens it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: '一覧' }).click();
  await page.getByRole('searchbox').fill('3bet');
  await page.getByRole('button', { name: /3-bet/ }).click();
  await expect(page.locator('.row.open')).toContainText('スリーベット');
  await expect(page.locator('.row.open .example')).toBeVisible();
});

test('remembers the card direction across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('button', { name: '日 → 英' }).click();
  await page.reload();
  await page.getByRole('button', { name: '設定' }).click();
  await expect(page.getByRole('button', { name: '日 → 英' })).toHaveAttribute('aria-pressed', 'true');
});

test('links back to the holdem-lab home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'holdem-lab' })).toHaveAttribute('href', 'http://localhost:5170/');
});
