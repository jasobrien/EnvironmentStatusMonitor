const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  timeout: 60000, // Increased timeout to 60 seconds for tests that trigger collection runs
  retries: 1,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure', // Keep trace on failure for debugging
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
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
});
