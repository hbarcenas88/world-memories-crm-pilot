import { expect, test } from '@playwright/test';

test('saves one client-trip workspace and lets the operator close it without a second warning', async ({ page }) => {
  const tripRow = page.getByRole('button', { name: /^Familia viaje / });
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill('Familia viaje');
  await page.getByLabel('Origen de adquisición').selectOption('Instagram');
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await tripRow.click();
  await page.getByRole('button', { name: 'Preparar cotización' }).click();
  await page.getByRole('button', { name: 'Marcar cotización enviada' }).click();
  await page.getByRole('button', { name: 'Registrar primer pago' }).click();
  await page.getByLabel('Anticipo').fill('250');
  await page.getByLabel('Moneda').last().selectOption('USD');
  await page.getByRole('button', { name: 'Confirmar venta' }).click();

  await page.getByRole('button', { name: 'Viajes' }).click();
  await tripRow.click();
  await page.getByLabel('Nota útil de familia').fill('Viajan con niños');
  await page.getByLabel('Nombre del servicio').fill('Hotel familiar');
  await page.getByRole('textbox', { name: 'Inicio del servicio' }).fill('10/12/2026');
  await page.getByRole('textbox', { name: 'Fin del servicio' }).fill('15/12/2026');
  await page.getByRole('button', { name: 'Añadir servicio' }).click();
  await page.getByRole('textbox', { name: 'Inicio manual del viaje' }).fill('10/12/2026');
  await page.getByRole('textbox', { name: 'Fin manual del viaje' }).fill('15/12/2026');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(tripRow).toContainText('10/12/2026 — 15/12/2026');
  await page.getByRole('button', { name: 'Cerrar expediente' }).click();
  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toHaveCount(0);
  await tripRow.click();
  await expect(page.getByRole('textbox', { name: 'Inicio manual del viaje' })).toHaveValue('10/12/2026');
  await expect(page.getByRole('textbox', { name: 'Fin manual del viaje' })).toHaveValue('15/12/2026');

  await page.getByRole('button', { name: 'Proveedores' }).click();
  await page.getByRole('button', { name: 'Nuevo Proveedor' }).click();
  await page.getByLabel('Nombre del Proveedor').fill('Hotel Aurora');
  await page.getByLabel('USD').check();
  await page.getByRole('button', { name: 'Guardar Proveedor' }).click();

  await page.getByRole('button', { name: 'Viajes' }).click();
  await tripRow.click();
  await page.getByLabel('Servicio para Proveedor').selectOption({ label: 'Hotel familiar' });
  await page.getByLabel('Proveedor para Servicio').selectOption({ label: 'Hotel Aurora' });
  await page.getByLabel('Moneda del componente').selectOption('USD');
  await page.getByLabel('Importe de venta').fill('900');
  await page.getByLabel('Comisión bruta esperada').fill('100');
  await page.getByRole('textbox', { name: 'Fecha límite de saldo' }).fill('30/12/2026');
  await page.getByRole('button', { name: 'Agregar Proveedor al Servicio' }).click();
  await expect(page.getByText('Anticipo de conversión: 250.00 USD')).toBeVisible();
  await page.getByLabel('Asignar anticipo de conversión').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Asignar anticipo a Hotel familiar' }).click();
  await page.getByLabel('Importe del pago de Hotel familiar').fill('200');
  await page.getByRole('textbox', { name: 'Fecha efectiva del pago de Hotel familiar' }).fill('12/11/2026');
  await page.getByRole('button', { name: 'Registrar pago de Hotel familiar' }).click();
  await expect(page.getByText('Total pagado: 450.00 USD')).toBeVisible();

  await page.getByRole('button', { name: 'Comisiones' }).click();
  await expect(page.getByText('80.00 USD', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar pago' }).click();
  await page.getByRole('textbox', { name: 'Fecha efectiva de pago' }).fill('20/12/2026');
  await page.getByRole('button', { name: 'Guardar pago' }).click();
  await expect(page.getByRole('heading', { name: 'Pagadas' })).toBeVisible();
});
