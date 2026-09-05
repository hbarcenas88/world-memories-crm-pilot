import { expect, test } from '@playwright/test';

test('shows the daily dashboard and reachable operational task queues', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Inicio' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dashboard operativo' }).getByRole('heading', { name: 'Viajeros en curso' })).toBeVisible();
  await expect(page.getByText('Comisiones esperadas')).toBeVisible();

  await page.getByRole('button', { name: 'Tareas' }).click();
  await expect(page.getByRole('heading', { name: 'Vencidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sin fecha' })).toBeVisible();
});
