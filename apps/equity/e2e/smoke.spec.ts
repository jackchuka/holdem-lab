import { expect, test } from '@playwright/test';

test('calculates a hand against a preset range and restores it from the URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'P1 を編集' }).click();
  await page.getByRole('button', { name: 'A♠', exact: true }).click();
  await page.getByRole('button', { name: 'A♥', exact: true }).click();
  await page.getByRole('button', { name: 'P2 を編集' }).click();
  await page.getByRole('tab', { name: 'レンジ', exact: true }).click();
  await page.getByRole('button', { name: 'CO', exact: true }).click();
  await page.getByRole('button', { name: '閉じる' }).click();

  await expect(page.getByTestId('equity-0')).toHaveText(/^\d+\.\d%$/);
  await expect(page).toHaveURL(/p=AsAh/);

  await page.reload();
  await expect(page.getByTestId('equity-0')).toHaveText(/^\d+\.\d%$/);
  await expect(page.getByRole('button', { name: 'P2 を編集' })).toContainText('CO オープン');
});

test('opens fresh with a notice on a broken link', async ({ page }) => {
  await page.goto('/?p=ZZ&p=x');
  await expect(page.getByRole('status')).toContainText('URL を読み込めなかった');
  await expect(page.getByTestId('equity-0')).toHaveText('—');
});
