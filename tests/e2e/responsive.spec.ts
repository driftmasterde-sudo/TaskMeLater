import { test, expect } from '@playwright/test';

/**
 * Responsive design E2E tests.
 *
 * Validates that the layout adapts correctly to mobile, tablet, and
 * desktop viewports. The app uses Tailwind responsive breakpoints:
 *   - md (768px): sidebar becomes visible
 *   - lg (1024px): sidebar is always visible, 3-column grid
 */

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('taskmelater'));
    await page.goto('/');
    await page.waitForSelector('text=Oriido', { timeout: 15000 });
  });

  test('Mobile viewport hides sidebar and shows hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // The sidebar should be hidden (the desktop sidebar container uses hidden md:block)
    // The sidebar content inside the md:block wrapper should not be visible
    const desktopSidebar = page.locator('.hidden.md\\:block');
    await expect(desktopSidebar).not.toBeVisible();

    // The hamburger button should be visible (it has aria-label="Open sidebar")
    const hamburger = page.locator('button[aria-label="Open sidebar"]');
    await expect(hamburger).toBeVisible();

    // Click the hamburger to open the mobile sidebar overlay
    await hamburger.click();

    // The mobile sidebar overlay should appear and show project names
    await expect(page.locator('text=Oriido').first()).toBeVisible();
    await expect(page.locator('text=MoveMaster').first()).toBeVisible();
  });

  test('Tablet viewport shows 2-column grid', async ({ page }) => {
    // Set tablet viewport (768px is the md breakpoint)
    await page.setViewportSize({ width: 768, height: 1024 });

    // Create two feature cards so we can verify the grid
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Tablet Feature One');
    await page.fill('#feature-desc', 'First card');
    await page.click('button:has-text("Create")');

    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Tablet Feature Two');
    await page.fill('#feature-desc', 'Second card');
    await page.click('button:has-text("Create")');

    // The grid should use md:grid-cols-2 at this breakpoint
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    // Verify grid has the md:grid-cols-2 class applied — we check computed style
    const gridColumns = await grid.evaluate(
      (el) => window.getComputedStyle(el).gridTemplateColumns
    );

    // At 768px with md:grid-cols-2, there should be two column tracks
    const columnCount = gridColumns.split(' ').filter((s) => s.trim()).length;
    expect(columnCount).toBe(2);
  });

  test('Desktop viewport shows sidebar and 3-column grid', async ({ page }) => {
    // Set desktop viewport (1024px is the lg breakpoint)
    await page.setViewportSize({ width: 1280, height: 900 });

    // The sidebar should be visible on desktop (the container with hidden md:block)
    const desktopSidebar = page.locator('.hidden.md\\:block');
    await expect(desktopSidebar).toBeVisible();

    // The hamburger button should NOT be visible on desktop (lg:hidden)
    const hamburger = page.locator('button[aria-label="Open sidebar"]');
    await expect(hamburger).not.toBeVisible();

    // Create three feature cards to verify 3-column grid
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Add Feature")');
      await page.fill('#feature-title', `Desktop Feature ${i}`);
      await page.fill('#feature-desc', `Card number ${i}`);
      await page.click('button:has-text("Create")');
    }

    // The grid should use lg:grid-cols-3 at this breakpoint
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    const gridColumns = await grid.evaluate(
      (el) => window.getComputedStyle(el).gridTemplateColumns
    );

    // At 1280px with lg:grid-cols-3, there should be three column tracks
    const columnCount = gridColumns.split(' ').filter((s) => s.trim()).length;
    expect(columnCount).toBe(3);
  });
});
