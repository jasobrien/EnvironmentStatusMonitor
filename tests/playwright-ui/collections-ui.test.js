const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('./pages/DashboardPage');
const { DataPage } = require('./pages/DataPage');
const { DeployPage } = require('./pages/DeployPage');
const { PerformancePage } = require('./pages/PerformancePage');

// Models the 4 Postman collections as UI tests using Page Object Model

test.describe('Dashboard Collection - UI Tests', () => {
  test('should load the dashboard page and return 200', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();
    await dashboard.expectPageTitleVisible();
  });
});

test.describe('Data Collection - UI Tests', () => {
  test('should load the directory page and return data', async ({ page }) => {
    const dataPage = new DataPage(page);
    await dataPage.gotoDirectory();
    await dataPage.expectDirectoryLoaded();
  });

  test('should load the schedule page and display schedule data', async ({ page }) => {
    const dataPage = new DataPage(page);
    await dataPage.gotoSchedule();
    await dataPage.expectScheduleLoaded();
    await dataPage.expectScheduleDataVisible();
  });
});

test.describe('Deploy Collection - UI Tests', () => {
  test('should load readyToDeploy for an environment', async ({ page }) => {
    const deploy = new DeployPage(page);
    await deploy.gotoEnvironment('dev');
    await deploy.expectResponseOk();
    await deploy.expectJsonArrayResponse();
  });

  test('should load readyToDeploy for an environment with transaction', async ({ page }) => {
    const deploy = new DeployPage(page);
    await deploy.gotoEnvironmentTrans('dev', 'dashboard');
    await deploy.expectResponseOk();
  });
});

test.describe('Performance Collection - UI Tests', () => {
  test('should load performance page for All time period', async ({ page }) => {
    const performance = new PerformancePage(page);
    await performance.goto('dev', 'All');
    await performance.expectLoaded();
    await performance.expectHeadingText('Development Performance - All Time');
    await performance.expectChartContainerVisible();
  });

  test('should load performance page for 30 day time period', async ({ page }) => {
    const performance = new PerformancePage(page);
    await performance.goto('dev', '30');
    await performance.expectLoaded();
    await performance.expectHeadingText('Development Performance - 30 days');
    await performance.expectChartContainerVisible();
  });
});
