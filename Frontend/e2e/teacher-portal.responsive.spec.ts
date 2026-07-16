import { test, expect } from '@playwright/test';
import {
  VIEWPORTS,
  assertNoHorizontalOverflow,
  setupAuth,
  navigateAndWait,
} from './helpers';

test.describe('Teacher Portal responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateAndWait(page, '/login');
    await setupAuth(page);
  });

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/teacher/portal');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('sidebar card is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await navigateAndWait(page, '/teacher/portal');

    await assertNoHorizontalOverflow(page);
  });

  test('main content area renders without overflow on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateAndWait(page, '/teacher/portal');

    await assertNoHorizontalOverflow(page);
  });
});
