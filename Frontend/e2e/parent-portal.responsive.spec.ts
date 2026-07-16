import { test, expect } from '@playwright/test';
import {
  VIEWPORTS,
  assertNoHorizontalOverflow,
  setupAuth,
  navigateAndWait,
  isMobileNavVisible,
  isDesktopSidebarVisible,
} from './helpers';

test.describe('Parent Portal responsiveness', () => {
  // Set up mock auth before each test
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateAndWait(page, '/login');
    await setupAuth(page);
  });

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/parent/portal');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('shows mobile nav on small screens (≤767px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/parent/portal');

    const mobileNav = await isMobileNavVisible(page);
    const sidebar = await isDesktopSidebarVisible(page);

    expect(mobileNav).toBe(true);
    expect(sidebar).toBe(false);
  });

  test('shows desktop sidebar on large screens (≥768px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await navigateAndWait(page, '/parent/portal');

    const sidebar = await isDesktopSidebarVisible(page);
    expect(sidebar).toBe(true);
  });

  test('header items are visible on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateAndWait(page, '/parent/portal');

    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 5000 });
    await assertNoHorizontalOverflow(page);
  });
});
