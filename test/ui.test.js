const { test, expect } = require('@playwright/test');

test.describe('UI Tests for FeatureStatusMonitor', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('http://localhost:8080/dashboard');
    // await expect(page).toHaveTitle(/Dashboard/);
  //  await expect(page.locator('pageTitle')).toHaveText('App Feature Health');
  });

  test('should load the performance page for dev environment', async ({ page }) => {
    await page.goto('http://localhost:8080/dashboard/performance/dev/7');
    await expect(page).toHaveTitle(/Feature Collection Performance/);
    await expect(page.locator('h2')).toHaveText('Feature Collection Performance');
    await expect(page.locator('#chart-container')).toBeVisible();
  });

  test('should load the login page when session is off', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    //await expect(page).toHaveTitle(/Login/);
  //  await expect(page.locator('form')).toBeVisible();
  });
});
