import { test, expect } from '@playwright/test';
import { VIEWPORTS, assertNoHorizontalOverflow, navigateAndWait } from './helpers';

test.describe('Login page responsiveness', () => {
  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/login');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('form card is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/login');

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });

    // Check email and password fields exist
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('form card is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateAndWait(page, '/login');

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('all form inputs fit within viewport width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/login');

    const form = page.locator('form').first();
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    // Form width should be ≤ viewport width with some padding
    expect(box!.width).toBeLessThanOrEqual(375);
  });
});
