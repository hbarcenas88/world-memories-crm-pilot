import { expect, test } from '@playwright/test';

test('operates a Lead from capture to first-payment conversion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill('Lead de prueba');
  await page.getByLabel('Origen de adquisición').selectOption('Instagram');
  await page.getByRole('button', { name: 'Guardar lead' }).click();

  await page.getByRole('button', { name: /Lead de prueba/ }).click();
  await page.getByRole('button', { name: 'Preparar cotización' }).click();
  await page.getByRole('button', { name: 'Marcar cotización enviada' }).click();
  await page.getByRole('button', { name: 'Registrar primer pago' }).click();
  await page.getByLabel('Anticipo').fill('250');
  await page.getByLabel('Moneda').last().selectOption('USD');
  await page.getByRole('button', { name: 'Confirmar venta' }).click();

  await expect(page.getByLabel('Detalle del lead').locator('.detail-status')).toHaveText('Lead convertido');
});
