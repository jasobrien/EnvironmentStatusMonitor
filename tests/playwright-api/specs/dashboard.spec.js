/**
 * dashboard.spec.js
 *
 * Scheduled Playwright spec — Dashboard page health checks.
 * Produces result key "dashboard" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/playwright-api/specs/dashboard.spec.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "playwright",
 *     "schedule": "Every30"
 *   }
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";

test.describe("Dashboard Page", () => {
    test("GET /dashboard returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard`);
        expect(response.status()).toBe(200);
    });

    test("dashboard page contains expected title", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard`);
        const text = await response.text();
        expect(text).toContain("Feature Status Monitor Dashboard");
    });

    test("GET /dashboard/manage returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard/manage`);
        expect(response.status()).toBe(200);
    });

    test("GET /dashboard/view/default returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard/view/default`);
        expect(response.status()).toBe(200);
    });
});
