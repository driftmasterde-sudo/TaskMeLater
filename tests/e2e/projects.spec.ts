import { test, expect } from '@playwright/test';

/**
 * Project management E2E tests.
 *
 * The app seeds four demo projects on first load: Oriido, MoveMaster,
 * TaskMeLater, and Sharaaty. These tests rely on that seed data and
 * validate sidebar interactions, project creation, view switching, and
 * the dark-mode toggle.
 */

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB to ensure demo seed runs fresh each time
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('taskmelater'));
    await page.goto('/');
    // Wait for the app to finish initialising (loading spinner gone)
    await page.waitForSelector('text=Oriido', { timeout: 15000 });
  });

  test('App loads and shows the four demo projects', async ({ page }) => {
    for (const name of ['Oriido', 'MoveMaster', 'TaskMeLater', 'Sharaaty']) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible();
    }
  });

  test('Can create a new project via "New Project" button', async ({ page }) => {
    // Click the New Project button in the sidebar
    await page.click('button:has-text("New Project")');

    // Fill in the project name
    await page.fill('input[placeholder="Project name"]', 'My Test Project');

    // Fill in an icon
    await page.fill('input[placeholder="Icon (emoji)"]', '🚀');

    // Submit the form
    await page.click('button:has-text("Add")');

    // The new project should appear in the sidebar
    await expect(page.locator('text=My Test Project').first()).toBeVisible();
  });

  test('Can switch between projects by clicking sidebar items', async ({ page }) => {
    // Oriido is selected by default (first project) — its name appears in the main header
    await expect(
      page.locator('h1:has-text("Oriido")').first()
    ).toBeVisible();

    // Click on MoveMaster in the sidebar
    await page.locator('button:has-text("MoveMaster")').first().click();

    // The main content header should now show MoveMaster
    await expect(
      page.locator('h1:has-text("MoveMaster")').first()
    ).toBeVisible();

    // Click on Sharaaty
    await page.locator('button:has-text("Sharaaty")').first().click();
    await expect(
      page.locator('h1:has-text("Sharaaty")').first()
    ).toBeVisible();
  });

  test('Can switch between Features and Errors & Changes views', async ({ page }) => {
    // By default the Features view is active
    await expect(page.locator('button:has-text("Add Feature")')).toBeVisible();

    // Click "Errors & Changes" sub-nav for the active project
    await page.locator('button:has-text("Errors & Changes")').first().click();

    // The Errors page should now show its header and add button
    await expect(page.locator('button:has-text("Add Error/Change")')).toBeVisible();

    // Switch back to Features
    await page.locator('button:has-text("Features")').first().click();
    await expect(page.locator('button:has-text("Add Feature")')).toBeVisible();
  });

  test('Dark mode toggle works', async ({ page }) => {
    // The toggle is the only button with the light/dark mode title
    const toggle = page.locator('button[title*="dark mode"], button[title*="light mode"]');
    await expect(toggle).toBeVisible();

    // Check initial state — may or may not be dark depending on system pref.
    const htmlBefore = await page.locator('html').getAttribute('class');

    // Click toggle
    await toggle.click();

    const htmlAfter = await page.locator('html').getAttribute('class');

    // The dark class should have been toggled
    if (htmlBefore?.includes('dark')) {
      expect(htmlAfter).not.toContain('dark');
    } else {
      expect(htmlAfter).toContain('dark');
    }

    // Toggle back
    await toggle.click();
    const htmlRestored = await page.locator('html').getAttribute('class');

    // Should be back to original
    if (htmlBefore?.includes('dark')) {
      expect(htmlRestored).toContain('dark');
    } else {
      expect(htmlRestored).not.toContain('dark');
    }
  });
});
