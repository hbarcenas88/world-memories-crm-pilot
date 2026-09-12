import { expect, test } from '@playwright/test';

test('keeps explicit archive and two-step deletion choices for a Lead with activity history', async ({ page }) => {
  const leadName = 'Consulta para eliminación deliberada';
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill(leadName);
  await page.getByLabel('Origen de adquisición').selectOption('Instagram');
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await page.getByRole('button', { name: new RegExp(`^${leadName}`) }).click();

  await page.getByRole('button', { name: `Acciones del lead ${leadName}` }).click();
  await page.getByRole('menuitem', { name: 'Archivar o eliminar' }).click();
  await expect(page.getByRole('dialog', { name: `Gestionar ${leadName}` })).toBeVisible();
  await expect(page.getByText(/Recomendamos archivar/)).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByRole('button', { name: 'Eliminar definitivamente' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();

  await expect(page.getByRole('button', { name: new RegExp(`^${leadName}`) })).toHaveCount(0);
});

test('keeps deletion-impact help readable inside the viewport at a 200 percent zoom viewport', async ({ page }) => {
  const leadName = 'Consulta con ayuda de impacto';
  await page.setViewportSize({ width: 635, height: 941 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill(leadName);
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await page.getByRole('button', { name: new RegExp(`^${leadName}`) }).click();
  await page.getByRole('button', { name: `Acciones del lead ${leadName}` }).click();
  await page.getByRole('menuitem', { name: 'Archivar o eliminar' }).click();

  const help = page.getByRole('button', { name: `Gestionar ${leadName}` });
  await help.hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Archivar conserva el registro y sus relaciones.');

  const [tooltipBox, viewport] = await Promise.all([
    tooltip.boundingBox(),
    page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  ]);
  expect(tooltipBox).not.toBeNull();
  expect(tooltipBox!.x).toBeGreaterThanOrEqual(8);
  expect(tooltipBox!.y).toBeGreaterThanOrEqual(8);
  expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(viewport.width - 8);
  expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(viewport.height - 8);
});

test('uses the common readable textarea surface for a lead cancellation note', async ({ page }) => {
  const leadName = 'Consulta con nota de cancelación';
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill(leadName);
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await page.getByRole('button', { name: new RegExp(`^${leadName}`) }).click();
  await page.getByRole('button', { name: 'Cancelar lead' }).click();

  const note = page.getByRole('textbox', { name: 'Nota de cancelación' });
  const presentation = await note.evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderStyle: style.borderTopStyle, borderWidth: style.borderTopWidth, minHeight: Number.parseFloat(style.minHeight), resize: style.resize };
  });
  expect(presentation).toEqual({ borderStyle: 'solid', borderWidth: '1px', minHeight: 96, resize: 'vertical' });
});
