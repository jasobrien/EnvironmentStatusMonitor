const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { open: 'never', outputFolder: 'tests/playwright-report' }]],
  outputDir: 'tests/test-results',
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'UI Tests',
      testMatch: /.*ui\.test\.js/,
    },
    {
      name: 'API Tests',
      testMatch: /.*playwright-api\/api.*\.test\.js/,
    },
    {
      name: 'Unit Tests',
      testMatch: /.*functions\.test\.js/,
    },
    {
      name: 'Runner Tests',
      testMatch: /.*runners\.test\.js/,
    },
    {
      name: 'Collections UI Tests',
      testMatch: /.*collections-ui\.test\.js/,
    },
    {
      name: 'Collections API Tests',
      testMatch: /.*collections-api\.test\.js/,
    },
    {
      name: 'API Spec Tests',
      testMatch: /.*specs\/.*\.spec\.js/,
    },
  ],
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
  // Alternative: use webServer for automatic server management
  // webServer: {
  //   command: 'node index.js',
  //   port: 8080,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
