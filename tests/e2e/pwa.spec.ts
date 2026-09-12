import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function buildForPwaRevision(revision: string) {
  const options = {
    cwd: process.cwd(),
    env: { ...process.env, VITE_WM_BUILD_REVISION: revision },
    stdio: 'pipe' as const,
  };
  execFileSync(process.execPath, [resolve(process.cwd(), 'node_modules/typescript/lib/tsc.js'), '-b'], options);
  execFileSync(process.execPath, [resolve(process.cwd(), 'node_modules/vite/bin/vite.js'), 'build'], options);
}

test('keeps the CRM available offline after its first desktop load', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
});

test('publishes the manifest and desktop icons required for installation', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const manifest = await (await request.get(new URL(href!, page.url()).toString())).json();
  expect(manifest).toMatchObject({ name: 'World Memories CRM', display: 'standalone', start_url: './' });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: 'icons/world-memories-monogram-192.svg' }),
    expect.objectContaining({ src: 'icons/world-memories-monogram-512.svg' }),
  ]));
  await expect((await request.get(new URL('brand/world-memories-logo.svg', page.url()).toString())).text()).resolves.toContain('#00aeef');
});

test('detects a second build on the same origin and protects a declared schema update', async ({ page }) => {
  test.setTimeout(120_000);
  const updateInfoPath = resolve(process.cwd(), 'public/world-memories-update.json');
  const originalUpdateInfo = readFileSync(updateInfoPath, 'utf8');
  try {
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    expect(await page.locator('[data-build-revision]').getAttribute('data-build-revision')).toBe('initial');

    writeFileSync(updateInfoPath, '{\n  "workspaceSnapshotVersion": 4\n}\n');
    buildForPwaRevision('schema-update');
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });

    await expect(page.getByText('Descarga primero un respaldo JSON actual antes de aplicar esta actualización.')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Actualizar ahora' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Ir a respaldo' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir a respaldo' }).click();
    await expect(page.getByRole('heading', { name: 'Datos y respaldo' })).toBeVisible();

    await page.getByRole('button', { name: 'Descargar respaldo JSON' }).click();

    await expect(page.getByRole('button', { name: 'Actualizar ahora' })).toBeEnabled();
  } finally {
    writeFileSync(updateInfoPath, originalUpdateInfo);
    buildForPwaRevision('initial');
  }
});
