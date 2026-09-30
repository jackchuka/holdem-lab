import { expect, test } from '@playwright/test';

test('steps through a trick and switches tricks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '一時停止' }).click();
  await page.getByRole('tab', { name: 'サムフリップ' }).click();
  const caption = page.getByTestId('caption');
  await expect(caption).toContainText('1/4');
  await page.getByRole('button', { name: '次のステップ' }).click();
  await expect(caption).toContainText('2/4');

  await page.getByRole('tab', { name: 'リフル' }).click();
  await expect(caption).toContainText('1/5');
  await page.getByRole('button', { name: '再生' }).click();
  await expect(caption).not.toContainText('1/5', { timeout: 3000 });
});

test('remembers speed and view across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '0.25×' }).click();
  await page.getByRole('button', { name: '向かい' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '0.25×' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '向かい' })).toHaveAttribute('aria-pressed', 'true');
});

test('links back to the holdem-lab home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'holdem-lab' })).toHaveAttribute('href', 'http://localhost:5170/');
});
