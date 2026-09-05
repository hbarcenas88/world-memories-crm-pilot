import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('has no serious or critical accessibility violations on the principal workspace', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('keeps keyboard focus visible while navigating the principal routes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Datos y respaldo', exact: true }).focus();

  await expect(page.getByRole('button', { name: 'Datos y respaldo', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Datos y respaldo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar respaldo JSON' })).toBeVisible();
});
