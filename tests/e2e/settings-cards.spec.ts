import { expect, test } from '@playwright/test';

test('groups global settings in cards and persists the interface language from Preferences', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Abrir Tipos de viaje' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir Preferencias y formatos' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir Preferencias y formatos' }).click();
  await expect(page.getByText('Fecha: DD/MM/YYYY')).toBeVisible();
  await page.getByRole('region', { name: 'Preferencias y formatos' }).getByLabel('Idioma').selectOption('en');
  await page.getByRole('button', { name: 'Guardar configuración' }).click();

  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Language')).toHaveValue('en');
  await page.getByRole('button', { name: 'Open Preferences and formats' }).click();
  await expect(page.getByText('Date: DD/MM/YYYY')).toBeVisible();
});

test('aligns catalog creation controls and keeps the availability state inside its row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();

  const newEntry = page.getByRole('textbox', { name: 'Nuevo tipo de viaje' });
  const add = page.getByRole('button', { name: 'Agregar tipo de viaje' });
  const [newEntryBox, addBox] = await Promise.all([newEntry.boundingBox(), add.boundingBox()]);
  expect(newEntryBox).not.toBeNull();
  expect(addBox).not.toBeNull();
  expect(Math.abs((newEntryBox!.y + newEntryBox!.height) - (addBox!.y + addBox!.height))).toBeLessThanOrEqual(2);

  const row = page.locator('.settings-catalog-list li').first();
  const [rowBox, labelBox, statusBox] = await Promise.all([
    row.boundingBox(),
    row.locator('.settings-catalog-label').boundingBox(),
    row.locator('.toggle-field').boundingBox(),
  ]);
  expect(rowBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(statusBox).not.toBeNull();
  expect(statusBox!.x).toBeGreaterThan(labelBox!.x + labelBox!.width);
  expect(statusBox!.x + statusBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1);
});

test('keeps the catalog input and its add action equally usable at a 200 percent zoom viewport', async ({ page }) => {
  await page.setViewportSize({ width: 635, height: 941 });
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();

  const newEntry = page.getByRole('textbox', { name: 'Nuevo tipo de viaje' });
  const add = page.getByRole('button', { name: 'Agregar tipo de viaje' });
  const [newEntryBox, addBox, viewport] = await Promise.all([
    newEntry.boundingBox(),
    add.boundingBox(),
    page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth })),
  ]);

  expect(newEntryBox).not.toBeNull();
  expect(addBox).not.toBeNull();
  expect(newEntryBox!.height).toBeGreaterThanOrEqual(41);
  expect(Math.abs(newEntryBox!.height - addBox!.height)).toBeLessThanOrEqual(3);
  expect(Math.abs((newEntryBox!.y + newEntryBox!.height) - (addBox!.y + addBox!.height))).toBeLessThanOrEqual(3);
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
});

test('guards shell navigation while an unsaved catalog draft is open', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();
  await page.getByRole('textbox', { name: 'Nuevo tipo de viaje' }).fill('Catálogo temporal');
  await page.getByRole('button', { name: 'Agregar tipo de viaje' }).click();

  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '¿Descartar cambios?' })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración global' })).toBeVisible();

  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
});

test('guards a hash-route change while an unsaved catalog draft is open', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();
  await page.getByRole('textbox', { name: 'Nuevo tipo de viaje' }).fill('Catálogo temporal');
  await page.getByRole('button', { name: 'Agregar tipo de viaje' }).click();

  await page.evaluate(() => { window.location.hash = '#/leads'; });
  await expect(page.getByRole('dialog', { name: '¿Descartar cambios?' })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración global' })).toBeVisible();

  await page.evaluate(() => { window.location.hash = '#/leads'; });
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
});

test('keeps an unsaved catalog draft when the shell language changes', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();
  await page.getByRole('textbox', { name: 'Nuevo tipo de viaje' }).fill('Catálogo temporal');
  await page.getByRole('button', { name: 'Agregar tipo de viaje' }).click();

  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('button', { name: 'Edit: Catálogo temporal' })).toBeVisible();
});

test('keeps an explicit catalog rename through a language change and a guarded save before navigating', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Abrir Tipos de viaje' }).click();

  const edit = page.getByRole('button', { name: /^Editar:/ }).first();
  const originalName = (await edit.getAttribute('aria-label'))!.replace('Editar: ', '');
  await edit.click();
  const renamed = 'Catálogo guardado sintético';
  await page.getByRole('textbox', { name: `Editar: ${originalName}` }).fill(renamed);

  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('textbox', { name: `Edit: ${renamed}` })).toHaveValue(renamed);

  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Discard changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByRole('textbox', { name: `Edit: ${renamed}` })).toHaveValue(renamed);

  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('dialog', { name: 'Discard changes?' }).getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
});
