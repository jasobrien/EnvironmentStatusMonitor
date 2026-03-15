/**
 * performance.spec.js
 *
 * Scheduled Playwright spec — Performance page health checks.
 * Produces result key "performance" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/playwright-api/specs/performance.spec.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "playwright",
 *     "schedule": "Every30"
 *   }
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";

test.describe("Performance Page", () => {
    test("GET /dashboard/performance/dev/All returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard/performance/dev/All`);
        expect(response.status()).toBe(200);
    });

    test("performance page contains expected content", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard/performance/dev/All`);
        const text = await response.text();
        expect(text).toContain("Feature Collection Performance");
    });

    test("GET /dashboard/performance/dev/30 returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard/performance/dev/30`);
        expect(response.status()).toBe(200);
    });

    test("GET /getSummaryStats/dev returns stats", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/getSummaryStats/dev`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty("Green");
        expect(body).toHaveProperty("Total");
    });
});
