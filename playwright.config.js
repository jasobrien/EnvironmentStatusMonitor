const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  timeout: 30000,
  retries: 1,
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
      testMatch: /.*api\.test\.js/,
    },
  ],
  globalSetup: './test/global-setup.js',
  globalTeardown: './test/global-teardown.js',
  // Alternative: use webServer for automatic server management
  // webServer: {
  //   command: 'node index.js',
  //   port: 8080,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
