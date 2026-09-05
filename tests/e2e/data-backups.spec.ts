import { expect, test } from '@playwright/test';

test('opens the guided data area and downloads a JSON backup without exposing an immediate restore action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Datos y respaldo', exact: true }).click();

  await expect(page.getByText(/restaurar sustituye los datos actuales/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restaurar respaldo' })).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar respaldo JSON' }).click();
  await expect((await download).suggestedFilename()).toMatch(/^world-memories-backup-.*\.json$/);
  await expect(page.getByRole('status')).toContainText('Respaldo JSON descargado');
});
