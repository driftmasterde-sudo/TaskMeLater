import { test, expect } from '@playwright/test';

/**
 * Error/Change card E2E tests.
 *
 * Covers creating, viewing, editing, copying prompts, filtering, and
 * deleting error/change cards within a project.
 */

test.describe('Error/Change Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('taskmelater'));
    await page.goto('/');
    await page.waitForSelector('text=Oriido', { timeout: 15000 });

    // Switch to Errors & Changes view
    await page.locator('button:has-text("Errors & Changes")').first().click();
    await expect(page.locator('button:has-text("Add Error/Change")')).toBeVisible();
  });

  test('Can add a new error/change card with page and prompt', async ({ page }) => {
    await page.click('button:has-text("Add Error/Change")');

    // Modal should appear
    await expect(page.locator('h2:has-text("Add Error / Change")')).toBeVisible();

    // The page dropdown should have default pages (Dashboard, Settings, Profile)
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Dashboard');

    // Fill in the prompt
    await page.locator('.fixed textarea').fill(
      'The dashboard page crashes when there are no projects loaded. Fix the null reference error in the project list component.'
    );

    // Submit
    await page.locator('.fixed button:has-text("Create")').click();

    // The card should appear in the grid
    await expect(page.locator('text=Page: Dashboard')).toBeVisible();
    await expect(
      page.locator('text=The dashboard page crashes').first()
    ).toBeVisible();
  });

  test('Error card shows page name and prompt preview in the grid', async ({ page }) => {
    // Create an error card
    await page.click('button:has-text("Add Error/Change")');
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Settings');
    await page.locator('.fixed textarea').fill('Settings page layout breaks on mobile viewport');
    await page.locator('.fixed button:has-text("Create")').click();

    // Verify the card content
    await expect(page.locator('text=Page: Settings')).toBeVisible();
    await expect(
      page.locator('text=Settings page layout breaks').first()
    ).toBeVisible();

    // Default badges should be visible
    const card = page.locator('.cursor-pointer:has-text("Settings page layout breaks")');
    await expect(card.locator('text=Medium')).toBeVisible();
    await expect(card.locator('text=Not Started')).toBeVisible();
  });

  test('Copy prompt button copies text to clipboard', async ({ context, page }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Create an error card
    await page.click('button:has-text("Add Error/Change")');
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Dashboard');
    const promptText = 'Fix the authentication timeout on the dashboard page';
    await page.locator('.fixed textarea').fill(promptText);
    await page.locator('.fixed button:has-text("Create")').click();

    // Click the Copy Prompt button on the card
    await page.locator('button:has-text("Copy Prompt")').first().click();

    // The button should briefly show "Copied"
    await expect(page.locator('text=Copied').first()).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(promptText);
  });

  test('Can click error card to open detail panel', async ({ page }) => {
    // Create an error card
    await page.click('button:has-text("Add Error/Change")');
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Profile');
    await page.locator('.fixed textarea').fill('Profile image upload fails for PNG files');
    await page.locator('.fixed button:has-text("Create")').click();

    // Click the card (not the copy button)
    await page.locator('.cursor-pointer:has-text("Profile image upload fails")').click();

    // The detail panel should be visible
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('text=Error / Change Details')).toBeVisible();
  });

  test('Can edit error fields in detail panel', async ({ page }) => {
    // Create an error card
    await page.click('button:has-text("Add Error/Change")');
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Dashboard');
    await page.locator('.fixed textarea').fill('Original error prompt text');
    await page.locator('.fixed button:has-text("Create")').click();

    // Open detail panel
    await page.locator('.cursor-pointer:has-text("Original error prompt text")').click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Edit the prompt text
    const promptTextarea = panel.locator('textarea').first();
    await promptTextarea.fill('Updated error prompt text with more details');
    await promptTextarea.blur();

    // Change page via dropdown
    const panelPageSelect = panel.locator('select').first();
    await panelPageSelect.selectOption('Settings');

    // Close panel
    await panel.locator('button[aria-label="Close panel"]').click();

    // Verify the card shows the updated page
    await expect(page.locator('text=Page: Settings').first()).toBeVisible();
  });

  test('Can delete an error card with confirmation', async ({ page }) => {
    // Create an error card
    await page.click('button:has-text("Add Error/Change")');
    const pageSelect = page.locator('.fixed select').first();
    await pageSelect.selectOption('Dashboard');
    await page.locator('.fixed textarea').fill('Error to be deleted');
    await page.locator('.fixed button:has-text("Create")').click();

    // Open detail panel
    await page.locator('.cursor-pointer:has-text("Error to be deleted")').click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // First click on Delete shows confirmation
    await panel.locator('button:has-text("Delete")').first().click();
    await expect(
      panel.locator('button:has-text("Are you sure? Click again to delete")')
    ).toBeVisible();

    // Confirm deletion
    await panel.locator('button:has-text("Are you sure? Click again to delete")').click();

    // The card should be gone
    await expect(page.locator('text=Error to be deleted')).not.toBeVisible();
  });

  test('Filter by page works', async ({ page }) => {
    // Create two error cards on different pages
    await page.click('button:has-text("Add Error/Change")');
    await page.locator('.fixed select').first().selectOption('Dashboard');
    await page.locator('.fixed textarea').fill('Dashboard error one');
    await page.locator('.fixed button:has-text("Create")').click();

    await page.click('button:has-text("Add Error/Change")');
    await page.locator('.fixed select').first().selectOption('Settings');
    await page.locator('.fixed textarea').fill('Settings error one');
    await page.locator('.fixed button:has-text("Create")').click();

    // Both cards should be visible
    await expect(page.locator('text=Dashboard error one').first()).toBeVisible();
    await expect(page.locator('text=Settings error one').first()).toBeVisible();

    // Filter by Dashboard page — the page filter is the select with "All Pages" option
    const pageFilter = page.locator('select:has(option[value="All"]):has-text("All Pages")');
    await pageFilter.selectOption('Dashboard');

    // Only Dashboard error should be visible
    await expect(page.locator('text=Dashboard error one').first()).toBeVisible();
    await expect(page.locator('text=Settings error one')).not.toBeVisible();

    // Reset filter
    await pageFilter.selectOption('All');
    await expect(page.locator('text=Settings error one').first()).toBeVisible();
  });
});
