import { expect, test } from '@playwright/test';
import { seedVisualWorkspace } from './fixtures/visualWorkspace';

test('validates, confirms and restores a freshly downloaded synthetic JSON backup', async ({ page }) => {
  await seedVisualWorkspace(page);
  await page.getByRole('button', { name: 'Datos y respaldo', exact: true }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar respaldo JSON' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.getByLabel('Archivo JSON para restaurar').setInputFiles(backupPath!);
  await expect(page.getByText(/Respaldo compatible:/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restaurar respaldo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Restaurar respaldo' }).click();
  await expect(page.getByRole('dialog', { name: 'Restaurar respaldo' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Restaurar respaldo' }).getByRole('button', { name: 'Restaurar respaldo' }).click();
  await expect(page.getByText('El respaldo se restauró por completo.', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByText('Familia Calderón de la Fuente con itinerario especial', { exact: true })).toBeVisible();
});
