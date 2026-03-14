/**
 * Playwright config used exclusively by the dashboard scheduler.
 * Runs specs from runners/playwright/specs/ as standalone API/HTTP tests
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
    },
    projects: [
        {
            name: "Scheduled Tests",
            testMatch: /.*\.spec\.js/,
        },
    ],
});
