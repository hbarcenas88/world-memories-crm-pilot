import { expect, test } from '@playwright/test';
import { seedVisualWorkspace } from './fixtures/visualWorkspace';

test('opens a full Lead workspace with a navigable breadcrumb and one record heading', async ({ page }) => {
  const leadName = 'Familia Calderón de la Fuente con itinerario especial';
  await seedVisualWorkspace(page);
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByText(leadName, { exact: true }).click();
  await page.getByRole('button', { name: 'Abrir expediente completo', exact: true }).click();

  const workspacePath = page.getByRole('navigation', { name: 'Ruta del expediente' });
  await expect(workspacePath.getByRole('button', { name: 'Leads', exact: true })).toBeVisible();
  await expect(workspacePath.getByText(leadName, { exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1, name: leadName })).toHaveCount(1);

  await workspacePath.getByRole('button', { name: 'Leads', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toHaveCount(1);
});
