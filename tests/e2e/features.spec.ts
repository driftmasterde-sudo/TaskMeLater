import { test, expect } from '@playwright/test';

/**
 * Feature card E2E tests.
 *
 * Covers creating, viewing, editing, filtering, searching, and deleting
 * feature cards within a project.
 */

test.describe('Feature Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('taskmelater'));
    await page.goto('/');
    await page.waitForSelector('text=Oriido', { timeout: 15000 });
    // Ensure we are on the Features view for the first project
    await expect(page.locator('button:has-text("Add Feature")')).toBeVisible();
  });

  test('Can add a new feature card with title and description', async ({ page }) => {
    await page.click('button:has-text("Add Feature")');

    // The modal should appear
    await expect(page.locator('h2:has-text("Add Feature")')).toBeVisible();

    // Fill in the form
    await page.fill('#feature-title', 'Login Page Redesign');
    await page.fill('#feature-desc', 'Redesign the login page with OAuth support');

    // Submit
    await page.click('button:has-text("Create")');

    // The card should appear in the grid
    await expect(page.locator('text=Login Page Redesign')).toBeVisible();
  });

  test('Feature card shows with correct priority badge and state chip', async ({ page }) => {
    // Create a feature first
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Priority Test Feature');
    await page.fill('#feature-desc', 'Testing default badges');
    await page.click('button:has-text("Create")');

    // Find the card
    const card = page.locator('button:has-text("Priority Test Feature")');
    await expect(card).toBeVisible();

    // Default priority is Medium, default state is Proposed
    await expect(card.locator('text=Medium')).toBeVisible();
    await expect(card.locator('text=Proposed')).toBeVisible();
  });

  test('Can click a feature card to open the detail panel', async ({ page }) => {
    // Create a feature
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Detail Panel Test');
    await page.fill('#feature-desc', 'Should open detail panel on click');
    await page.click('button:has-text("Create")');

    // Click the card
    await page.locator('button:has-text("Detail Panel Test")').click();

    // The detail panel should be visible
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('text=Feature Details')).toBeVisible();
  });

  test('Can edit feature title and description in detail panel', async ({ page }) => {
    // Create a feature
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Editable Feature');
    await page.fill('#feature-desc', 'Original description');
    await page.click('button:has-text("Create")');

    // Open detail panel
    await page.locator('button:has-text("Editable Feature")').click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Edit the title — the detail panel uses defaultValue inputs that save onBlur
    const titleInput = panel.locator('input[type="text"]').first();
    await titleInput.fill('Updated Feature Title');
    await titleInput.blur();

    // Edit the description
    const descTextarea = panel.locator('textarea').first();
    await descTextarea.fill('Updated description text');
    await descTextarea.blur();

    // Close the panel
    await panel.locator('button[aria-label="Close panel"]').click();

    // The card in the grid should now show the updated title
    await expect(page.locator('text=Updated Feature Title')).toBeVisible();
  });

  test('Can change feature priority and state via dropdowns', async ({ page }) => {
    // Create a feature
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Priority Change Test');
    await page.fill('#feature-desc', 'Will change priority and state');
    await page.click('button:has-text("Create")');

    // Open detail panel
    await page.locator('button:has-text("Priority Change Test")').click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Change priority to Critical
    const prioritySelect = panel.locator('select').nth(0);
    await prioritySelect.selectOption('Critical');

    // Change state to Implementing
    const stateSelect = panel.locator('select').nth(1);
    await stateSelect.selectOption('Implementing');

    // Close panel
    await panel.locator('button[aria-label="Close panel"]').click();

    // Verify the card now shows the updated badges
    const card = page.locator('button:has-text("Priority Change Test")');
    await expect(card.locator('text=Critical')).toBeVisible();
    await expect(card.locator('text=Implementing')).toBeVisible();
  });

  test('Can delete a feature card with confirmation', async ({ page }) => {
    // Create a feature
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Delete Me Feature');
    await page.fill('#feature-desc', 'This will be deleted');
    await page.click('button:has-text("Create")');

    // Open detail panel
    await page.locator('button:has-text("Delete Me Feature")').click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Click Delete — first click shows confirmation
    await panel.locator('button:has-text("Delete")').first().click();

    // The button should now show the confirmation text
    await expect(
      panel.locator('button:has-text("Are you sure? Click again to delete")')
    ).toBeVisible();

    // Confirm deletion
    await panel.locator('button:has-text("Are you sure? Click again to delete")').click();

    // The panel should close and the card should be gone
    await expect(page.locator('text=Delete Me Feature')).not.toBeVisible();
  });

  test('Filter by priority works', async ({ page }) => {
    // Create two features with different priorities
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Critical Feature');
    await page.fill('#feature-desc', 'High urgency');
    await page.click('button:has-text("Create")');

    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Low Feature');
    await page.fill('#feature-desc', 'Low urgency');
    await page.click('button:has-text("Create")');

    // Change the second feature to Low priority via detail panel
    await page.locator('button:has-text("Low Feature")').click();
    const panel = page.locator('[role="dialog"]');
    await panel.locator('select').nth(0).selectOption('Low');
    await panel.locator('button[aria-label="Close panel"]').click();

    // Change the first feature to Critical priority
    await page.locator('button:has-text("Critical Feature")').click();
    await panel.locator('select').nth(0).selectOption('Critical');
    await panel.locator('button[aria-label="Close panel"]').click();

    // Now filter by Critical priority using the filter bar select
    // The priority filter is the first select in the filter bar area
    const priorityFilter = page.locator('select:has(option[value="Critical"])').first();
    await priorityFilter.selectOption('Critical');

    // Only Critical Feature should be visible
    await expect(page.locator('button:has-text("Critical Feature")')).toBeVisible();
    await expect(page.locator('button:has-text("Low Feature")')).not.toBeVisible();

    // Reset filter
    await priorityFilter.selectOption('All');
    await expect(page.locator('button:has-text("Low Feature")')).toBeVisible();
  });

  test('Search by title works', async ({ page }) => {
    // Create two features
    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Authentication System');
    await page.fill('#feature-desc', 'JWT auth');
    await page.click('button:has-text("Create")');

    await page.click('button:has-text("Add Feature")');
    await page.fill('#feature-title', 'Dashboard Charts');
    await page.fill('#feature-desc', 'Analytics charts');
    await page.click('button:has-text("Create")');

    // Search for "auth"
    await page.fill('input[placeholder="Search features..."]', 'auth');

    // Only Authentication System should be visible
    await expect(page.locator('button:has-text("Authentication System")')).toBeVisible();
    await expect(page.locator('button:has-text("Dashboard Charts")')).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder="Search features..."]', '');

    // Both should be visible again
    await expect(page.locator('button:has-text("Authentication System")')).toBeVisible();
    await expect(page.locator('button:has-text("Dashboard Charts")')).toBeVisible();
  });
});
