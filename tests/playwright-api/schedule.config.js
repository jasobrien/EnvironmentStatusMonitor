/**
 * Playwright config used exclusively by the dashboard scheduler.
 * Runs specs from tests/playwright-api/specs/ as standalone API/HTTP tests
 * (no UI, no global server setup).
 */
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./specs",
    timeout: 30000,
    retries: 0,
    reporter: [["json"]],
    use: {
        headless: true,
        ignoreHTTPSErrors: true,
        baseURL: process.env.MONITOR_BASE_URL || 'http://localhost:8080',
    },
    projects: [
        {
            name: "Scheduled Tests",
            testMatch: /.*\.(spec|test)\.js/,
        },
    ],
});
