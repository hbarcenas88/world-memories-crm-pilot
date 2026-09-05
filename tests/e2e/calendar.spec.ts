import { expect, test } from '@playwright/test';

test('projects a trip in the calendar and opens its contextual panel with one click', async ({ page }) => {
  const month = new Date().toISOString().slice(0, 7);
  const [year, numberMonth] = month.split('-');
  const startOn = `10/${numberMonth}/${year}`;
  const endOn = `14/${numberMonth}/${year}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill('Familia calendario');
  await page.getByLabel('Origen de adquisición').selectOption('Instagram');
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await page.getByRole('button', { name: /Familia calendario/ }).click();
  await page.getByRole('button', { name: 'Preparar cotización' }).click();
  await page.getByRole('button', { name: 'Marcar cotización enviada' }).click();
  await page.getByRole('button', { name: 'Registrar primer pago' }).click();
  await page.getByLabel('Anticipo').fill('250');
  await page.getByLabel('Moneda').last().selectOption('USD');
  await page.getByRole('button', { name: 'Confirmar venta' }).click();
  await page.getByRole('button', { name: 'Viajes' }).click();
  await page.getByRole('button', { name: /Familia calendario/ }).click();
  await page.getByRole('textbox', { name: 'Inicio manual del viaje' }).fill(startOn);
  await page.getByRole('textbox', { name: 'Fin manual del viaje' }).fill(endOn);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await page.getByRole('button', { name: 'Calendario', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Vista mensual' })).toBeVisible();
  await page.getByRole('button', { name: /Viaje de Familia calendario/ }).first().click();
  await expect(page.getByRole('complementary', { name: 'Detalle del calendario' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir viaje' }).click();
  await expect(page.getByRole('heading', { name: 'Viajes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vista semanal' })).toHaveCount(0);
});
