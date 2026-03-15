const { test, expect } = require('@playwright/test');

test.describe('UI Tests for FeatureStatusMonitor', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should load the performance page for dev environment', async ({ page }) => {
    await page.goto('/dashboard/performance/dev/7');
    await expect(page).toHaveTitle(/Feature Collection Performance/);
    await expect(page.locator('h1')).toHaveText('Development Performance - 7 days');
    await expect(page.locator('#chart-container')).toBeVisible();
  });

  test('should display correct environment name in performance page heading', async ({ page }) => {
    // Test Development environment
    await page.goto('/dashboard/performance/dev/7');
    await expect(page.locator('h1')).toHaveText('Development Performance - 7 days');

    // Test Test environment
    await page.goto('/dashboard/performance/test/14');
    await expect(page.locator('h1')).toHaveText('Test Performance - 14 days');

    // Test Staging environment
    await page.goto('/dashboard/performance/staging/30');
    await expect(page.locator('h1')).toHaveText('Staging Performance - 30 days');
  });

  test('should display "All Time" for All days selection', async ({ page }) => {
    await page.goto('/dashboard/performance/staging/All');
    await expect(page.locator('h1')).toHaveText('Staging Performance - All Time');
  });

  test('should display links to all three environments', async ({ page }) => {
    await page.goto('/dashboard/performance/dev/7');
    
    // Check that all environment sections are visible
    await expect(page.locator('text=Development Performance Graphs')).toBeVisible();
    await expect(page.locator('text=Test Performance Graphs')).toBeVisible();
    await expect(page.locator('text=Staging Performance Graphs')).toBeVisible();
    
    // Check that links to other environments are available
    await expect(page.locator('a[href="/dashboard/performance/test/7"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/performance/staging/7"]')).toBeVisible();
  });

  test('should be able to switch between environments', async ({ page }) => {
    // Start at dev
    await page.goto('/dashboard/performance/dev/7');
    await expect(page.locator('h1')).toHaveText('Development Performance - 7 days');
    
    // Click link to test environment
    await page.click('a[href="/dashboard/performance/test/7"]');
    await expect(page.locator('h1')).toHaveText('Test Performance - 7 days');
    
    // Click link to staging environment
    await page.click('a[href="/dashboard/performance/staging/7"]');
    await expect(page.locator('h1')).toHaveText('Staging Performance - 7 days');
  });

  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
  });
});
