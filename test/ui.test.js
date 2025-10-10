const { test, expect } = require('@playwright/test');

test.describe('UI Tests for FeatureStatusMonitor', () => {
  test('should load the dashboard page', async ({ page }) => {
    const response = await page.goto('http://localhost:8080/dashboard');
    // Check that the page loads successfully
    expect(response.status()).toBeLessThan(400);
  });

  test('should load the performance page for dev environment', async ({ page }) => {
    const response = await page.goto('http://localhost:8080/dashboard/performance/dev/7');
    expect(response.status()).toBeLessThan(400);
    // Check for expected page elements
    await expect(page.locator('h2')).toHaveText('Feature Collection Performance');
    await expect(page.locator('#chart-container')).toBeVisible();
  });

  test('should load the home page', async ({ page }) => {
    const response = await page.goto('http://localhost:8080/');
    // Check that the page loads successfully
    expect(response.status()).toBeLessThan(400);
  });
});
