import { expect, test } from '@playwright/test';

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
