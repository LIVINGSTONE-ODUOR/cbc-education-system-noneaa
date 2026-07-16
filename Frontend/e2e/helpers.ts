import { Page, expect } from '@playwright/test';

/**
 * Viewport presets for responsive testing.
 * Covers mobile, tablet, and desktop breakpoints.
 */
export const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 667 },    // iPhone SE
  { name: 'mobile-414', width: 414, height: 896 },    // iPhone 11 Pro Max
  { name: 'tablet-768', width: 768, height: 1024 },   // iPad
  { name: 'tablet-1024', width: 1024, height: 768 },  // iPad landscape
  { name: 'desktop-1280', width: 1280, height: 800 }, // Standard
  { name: 'desktop-1440', width: 1440, height: 900 }, // Large
  { name: 'desktop-1920', width: 1920, height: 1080 },// Full HD
] as const;

/** A mock school_admin user for auth bypass in tests */
export const MOCK_ADMIN_USER = {
  id: 'test-user-1',
  email: 'admin@school.com',
  role: 'school_admin' as const,
  firstName: 'Test',
  lastName: 'Admin',
  schoolId: 'test-school-1',
  schoolName: 'Test School',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Set up mock authentication state in localStorage.
 * Call this before navigating to protected routes.
 */
export async function setupAuth(page: Page) {
  await page.evaluate((mockUser) => {
    localStorage.setItem('cbe_access_token', 'playwright-mock-token');
    localStorage.setItem('cbe_refresh_token', 'playwright-mock-refresh-token');
    localStorage.setItem('cbe_user', JSON.stringify(mockUser));
  }, MOCK_ADMIN_USER);
}

/**
 * Assert that the page has no horizontal overflow.
 * Detects content breaking out of the viewport width.
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const overflowWidth = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflowWidth).toBeLessThanOrEqual(1);
}

/**
 * Assert that an element matching the selector is within the viewport.
 */
export async function assertElementInViewport(page: Page, selector: string) {
  const inView = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 && rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
  expect(inView).toBe(true);
}

/**
 * Check whether the mobile horizontal navigation is visible.
 * Hidden on desktop via Tailwind's `md:hidden`.
 */
export async function isMobileNavVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return false;
    const style = window.getComputedStyle(nav);
    // The mobile nav is hidden on md+ via `md:hidden` which generates
    // display:none in the md media query. On small screens it's visible.
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Check whether the desktop sidebar navigation is visible.
 * Hidden on mobile via Tailwind's `hidden md:block`.
 */
export async function isDesktopSidebarVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return false;
    const style = window.getComputedStyle(aside);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Load a route and wait for the page to settle.
 * Uses 'domcontentloaded' + a short delay to avoid hanging on
 * long-polling connections or websocket timeouts.
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Give the React app time to hydrate and render
  await page.waitForTimeout(2000);
}
