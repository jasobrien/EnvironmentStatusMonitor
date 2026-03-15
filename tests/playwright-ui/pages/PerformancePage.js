const { expect } = require('@playwright/test');

class PerformancePage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.chartContainer = page.locator('#chart-container');
    this.devLinks = page.locator('text=Development Performance Graphs');
    this.testLinks = page.locator('text=Test Performance Graphs');
    this.stagingLinks = page.locator('text=Staging Performance Graphs');
  }

  getUrl(env, days) {
    return `/dashboard/performance/${env}/${days}`;
  }

  async goto(env, days) {
    await this.page.goto(this.getUrl(env, days));
  }

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/Feature Collection Performance/);
  }

  async expectHeadingText(expectedText) {
    await expect(this.heading).toHaveText(expectedText);
  }

  async expectChartContainerVisible() {
    await expect(this.chartContainer).toBeVisible();
  }

  async expectEnvironmentLinksVisible() {
    await expect(this.devLinks).toBeVisible();
    await expect(this.testLinks).toBeVisible();
    await expect(this.stagingLinks).toBeVisible();
  }

  async clickEnvironmentLink(env, days) {
    await this.page.click(`a[href="/dashboard/performance/${env}/${days}"]`);
  }
}

module.exports = { PerformancePage };
