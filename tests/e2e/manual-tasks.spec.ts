import { expect, test } from '@playwright/test';

function operationalDate(date: Date): string {
  return [String(date.getUTCDate()).padStart(2, '0'), String(date.getUTCMonth() + 1).padStart(2, '0'), date.getUTCFullYear()].join('/');
}

test('creates, edits, completes and reopens a manual task across Tasks, Dashboard and Calendar', async ({ page }) => {
  const dueDate = new Date();
  dueDate.setUTCDate(dueDate.getUTCDate() - 1);
  await page.goto('/');
  await page.getByRole('button', { name: 'Tareas' }).click();
  await page.getByRole('button', { name: 'Nueva tarea' }).click();
  await page.getByLabel('Título de la tarea').fill('Confirmar itinerario manual');
  await page.getByRole('textbox', { name: 'Fecha límite' }).fill(operationalDate(dueDate));
  await page.getByLabel('Hora (opcional)').fill('14:30');
  await page.getByRole('button', { name: 'Crear tarea' }).click();
  await expect(page.getByText('Confirmar itinerario manual', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Editar tarea' }).click();
  await page.getByLabel('Título de la tarea').fill('Confirmar itinerario actualizado');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Confirmar itinerario actualizado', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Inicio' }).click();
  await expect(page.getByText('Confirmar itinerario actualizado', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Calendario', exact: true }).click();
  await expect(page.getByText('Confirmar itinerario actualizado', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Tareas' }).click();
  await page.getByRole('button', { name: 'Completar: Confirmar itinerario actualizado' }).click();
  await page.getByRole('button', { name: 'Deshacer: Confirmar itinerario actualizado' }).click();
  await expect(page.getByText('Confirmar itinerario actualizado', { exact: true })).toBeVisible();
});
