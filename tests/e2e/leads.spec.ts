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
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByLabel('Anticipo').fill('250');
  await page.getByLabel('Moneda').last().selectOption('USD');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Confirmar venta' }).click();

  await expect(page.getByLabel('Detalle del lead').locator('.detail-status')).toHaveText('Lead convertido');
});

test('persists a selected residence, independent phone prefix, email, and numeric budget without translating captured data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill('Contacto internacional sintético');

  const residence = page.getByRole('combobox', { name: 'País de residencia' });
  await residence.click();
  await residence.fill('Mexico');
  await residence.press('ArrowDown');
  await residence.press('Enter');
  const phoneCountry = page.getByRole('combobox', { name: 'Código internacional' });
  await phoneCountry.click();
  await phoneCountry.fill('Panama');
  await phoneCountry.press('ArrowDown');
  await phoneCountry.press('Enter');
  await page.getByLabel('Teléfono').fill('60000000');
  await page.getByLabel('Correo').fill('ana+viajes@example.org');
  const budget = page.getByLabel('Presupuesto');
  await budget.pressSequentially('1234.56');
  await expect(budget).toHaveValue('1,234.56');
  await page.getByLabel('Moneda').selectOption('USD');
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await expect(page.getByRole('button', { name: /Contacto internacional sintético/ })).toBeVisible();

  await page.reload();
  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('button', { name: 'New lead' })).toBeVisible();

  const captured = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('world-memories-crm');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('leads', 'readonly');
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const request = transaction.objectStore('leads').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return rows.find((row) => (row as { name?: string }).name === 'Contacto internacional sintético') as {
      residenceCountry?: string;
      phone?: string;
      email?: string;
      budget?: { amount: number; currency: string };
    } | undefined;
  });

  expect(captured).toEqual(expect.objectContaining({
    residenceCountry: 'MX',
    phone: '+50760000000',
    email: 'ana+viajes@example.org',
    budget: { amount: 1234.56, currency: 'USD' },
  }));
});

test('keeps the email control compact and places known travel dates after the date status', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();

  const email = page.getByLabel('Correo');
  const note = page.getByLabel('Nota comercial');
  const [emailBox, noteBox] = await Promise.all([email.boundingBox(), note.boundingBox()]);
  expect(emailBox).not.toBeNull();
  expect(noteBox).not.toBeNull();
  expect(emailBox!.height).toBeLessThan(noteBox!.height);

  await page.getByLabel('Fechas').selectOption('dates_known');
  const start = await page.getByRole('textbox', { name: 'Inicio tentativo' }).boundingBox();
  const travelType = await page.getByLabel('Tipo de viaje').boundingBox();
  const budget = await page.getByLabel('Presupuesto').boundingBox();
  expect(start).not.toBeNull();
  expect(travelType).not.toBeNull();
  expect(budget).not.toBeNull();
  expect(start!.y).toBeGreaterThan(travelType!.y);
  expect(start!.y).toBeLessThan(budget!.y);
});
