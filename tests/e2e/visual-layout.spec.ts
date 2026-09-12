import { expect, test } from '@playwright/test';

test('keeps long-record panel controls separated at supported widths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo lead' }).click();
  await page.getByLabel('Nombre o referencia').fill('Familia con un nombre de expediente intencionalmente largo para comprobar las acciones');
  await page.getByLabel('Origen de adquisición').selectOption('Instagram');
  await page.getByRole('button', { name: 'Guardar lead' }).click();
  await page.getByRole('button', { name: /Familia con un nombre/ }).click();

  const divider = page.getByRole('separator', { name: 'Ajustar ancho del panel de detalle' });
  const reset = page.getByRole('button', { name: 'Restablecer ancho del panel' });
  for (const width of ['320', '350', '560']) {
    await divider.evaluate((element, value) => element.setAttribute('aria-valuenow', value), width);
    await page.keyboard.press('ArrowRight');
    const resetBox = await reset.boundingBox();
    const openBox = await page.getByRole('button', { name: 'Abrir expediente completo', exact: true }).boundingBox();
    expect(resetBox).not.toBeNull(); expect(openBox).not.toBeNull();
    const resetRight = (resetBox?.x ?? 0) + (resetBox?.width ?? 0);
    const openRight = (openBox?.x ?? 0) + (openBox?.width ?? 0);
    expect(resetRight <= (openBox?.x ?? 0) + 1 || openRight <= (resetBox?.x ?? 0) + 1).toBe(true);
  }
});
