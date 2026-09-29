import { expect, test } from '@playwright/test';

test('answers a range question without moving the hero cards', async ({ page }) => {
  await page.goto('/');
  for (const label of ['勝率', 'アウツ', 'ポットオッズ']) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  await page.getByRole('button', { name: '開始する' }).click();

  const hero = page.getByTestId('hero');
  await expect(hero).toBeVisible();
  const before = await hero.boundingBox();

  await page.getByRole('button', { name: 'Fold', exact: true }).click();
  await expect(page.getByTestId('next')).toBeVisible();
  expect(await hero.boundingBox()).toEqual(before);

  await page.getByTestId('next').click();
  await expect(page.getByTestId('progress')).toHaveText(/^2 \/ \d+$/);
});
