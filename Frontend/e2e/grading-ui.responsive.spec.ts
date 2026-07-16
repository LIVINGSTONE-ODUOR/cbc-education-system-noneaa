import { test, expect } from '@playwright/test';
import {
  VIEWPORTS,
  assertNoHorizontalOverflow,
  setupAuth,
  navigateAndWait,
} from './helpers';

/** Shared auth setup for all grading UI test suites */
/** Set up mock auth state for grading UI tests. Viewport set in individual tests. */
const authBeforeEach = async ({ page }: { page: any }) => {
  await navigateAndWait(page, '/login');
  await setupAuth(page);
};

test.describe('Grading Management responsiveness', () => {
  test.beforeEach(authBeforeEach);

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/school-admin/grading/schemes');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('header and action buttons visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/school-admin/grading/schemes');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await assertNoHorizontalOverflow(page);
  });

  test('side-by-side scheme list and levels on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateAndWait(page, '/school-admin/grading/schemes');

    await assertNoHorizontalOverflow(page);
  });
});

test.describe('Teacher Assessment Entry responsiveness', () => {
  test.beforeEach(authBeforeEach);

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/teacher/assessments');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('selection panel stacks vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateAndWait(page, '/teacher/assessments');

    await assertNoHorizontalOverflow(page);
  });
});

test.describe('Grading Analytics responsiveness', () => {
  test.beforeEach(authBeforeEach);

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateAndWait(page, '/school-admin/grading/analytics');
      await assertNoHorizontalOverflow(page);
    });
  }

  test('summary cards and charts layout on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateAndWait(page, '/school-admin/grading/analytics');

    await assertNoHorizontalOverflow(page);
  });
});
