import { expect, test } from '@playwright/test';
import { seedVisualWorkspace } from './fixtures/visualWorkspace';

test('keeps populated desktop modules readable in Spanish and English without global horizontal overflow', async ({ page }) => {
  await seedVisualWorkspace(page);
  const modules = ['Inicio', 'Leads', 'Clientes y familias', 'Viajes', 'Calendario', 'Tareas', 'Comisiones', 'Proveedores', 'Datos y respaldo', 'Configuración'];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 900, height: 700 }]) {
    await page.setViewportSize(viewport);
    for (const module of modules) {
      await page.getByRole('button', { name: module, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const hasNoGlobalHorizontalOverflow = await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth);
      expect(hasNoGlobalHorizontalOverflow).toBe(true);
    }
  }

  await page.getByRole('button', { name: 'Tareas', exact: true }).click();
  await expect(page.getByText('Llamar a la familia de prueba', { exact: true })).toBeVisible();
  await expect(page.getByText('07/09/2026 · 14:30')).toBeVisible();
  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByText('Llamar a la familia de prueba', { exact: true })).toBeVisible();
});
