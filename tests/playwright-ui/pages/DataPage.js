const { expect } = require('@playwright/test');

class DataPage {
  constructor(page) {
    this.page = page;
    this.directoryUrl = '/data/directory';
    this.scheduleUrl = '/data/schedule';
    this.scheduleHeading = page.locator('h1');
    this.dataContainer = page.locator('#data-container');
    this.headerContainer = page.locator('#header-container');
  }

  async gotoDirectory() {
    await this.page.goto(this.directoryUrl);
  }

  async gotoSchedule() {
    await this.page.goto(this.scheduleUrl);
  }

  async expectDirectoryLoaded() {
    await expect(this.page).toHaveURL(/data\/directory/);
    const response = await this.page.evaluate(() =>
      document.body.innerText
    );
    expect(response.length).toBeGreaterThan(0);
  }

  async expectScheduleLoaded() {
    await expect(this.page).toHaveURL(/data\/schedule/);
    await expect(this.page).toHaveTitle(/Schedule/);
  }

  async expectScheduleDataVisible() {
    await expect(this.dataContainer).toBeVisible();
  }
}

module.exports = { DataPage };
