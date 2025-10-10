const { test, expect } = require('@playwright/test');

test.describe('UI Tests for FeatureStatusMonitor', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should load the performance page for dev environment', async ({ page }) => {
    await page.goto('/dashboard/performance/dev/7');
    await expect(page).toHaveTitle(/Feature Collection Performance/);
    await expect(page.locator('h2')).toHaveText('Feature Collection Performance');
    await expect(page.locator('#chart-container')).toBeVisible();
  });

  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
  });
});
