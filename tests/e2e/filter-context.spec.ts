import { expect, test } from '@playwright/test';
import { seedVisualWorkspace } from './fixtures/visualWorkspace';

test('keeps archive filters explicit while opening and returning from a populated Lead', async ({ page }) => {
  await seedVisualWorkspace(page);
  await page.getByRole('button', { name: 'Leads', exact: true }).click();

  await expect(page.getByText('Familia Calderón de la Fuente con itinerario especial', { exact: true })).toBeVisible();
  await expect(page.getByText('Consulta archivada de prueba', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Archivados', exact: true }).click();
  await expect(page.getByText('Consulta archivada de prueba', { exact: true })).toBeVisible();
  await page.getByText('Consulta archivada de prueba', { exact: true }).click();
  await page.getByRole('button', { name: 'Abrir expediente completo', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Consulta archivada de prueba' })).toBeVisible();

  await page.getByRole('button', { name: 'Volver a la lista' }).click();
  await expect(page.getByRole('button', { name: 'Archivados', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /Consulta archivada de prueba Web/ })).toBeVisible();
});

test('preserves every Lead filter while returning from its full workspace', async ({ page }) => {
  const leadName = 'Familia Calderón de la Fuente con itinerario especial';
  await seedVisualWorkspace(page);
  await page.getByRole('button', { name: 'Leads', exact: true }).click();

  await page.locator('#lead-search').fill('Calderón');
  await page.getByLabel('Filtrar por origen').selectOption('Web');
  await page.getByLabel('Filtrar por estado').selectOption('follow_up');
  await expect(page.getByText(leadName, { exact: true })).toBeVisible();

  await page.getByText(leadName, { exact: true }).click();
  await page.getByRole('button', { name: 'Abrir expediente completo', exact: true }).click();
  await page.getByRole('button', { name: 'Volver a la lista' }).click();

  await expect(page.locator('#lead-search')).toHaveValue('Calderón');
  await expect(page.getByLabel('Filtrar por origen')).toHaveValue('Web');
  await expect(page.getByLabel('Filtrar por estado')).toHaveValue('follow_up');
  const returnedLead = page.getByRole('button', { name: new RegExp(`^${leadName}`) });
  await expect(returnedLead).toBeVisible();
  await expect(returnedLead).toBeFocused();
});
