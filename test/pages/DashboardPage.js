const { expect } = require('@playwright/test');

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.url = '/dashboard';
    this.pageTitle = page.locator('#pageTitle');
    this.targetCanvas = page.locator('#targetCanvas');
    this.targetLegend = page.locator('#targetLegend');
    this.lastUpdated = page.locator('#lastUpdated');
    this.performanceButtons = page.locator('#performanceButtons');
    this.refreshButton = page.locator('button', { hasText: 'Refresh Dashboard' });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.page).toHaveTitle(/Feature Status Monitor Dashboard/);
  }

  async expectPageTitleVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectCanvasVisible() {
    await expect(this.targetCanvas).toBeVisible();
  }

  async expectPerformanceButtonsVisible() {
    await expect(this.performanceButtons).toBeVisible();
  }
}

module.exports = { DashboardPage };
