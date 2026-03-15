/**
 * example-health.spec.js
 *
 * Example Playwright spec designed to run as a scheduled dashboard test.
 * Add this to schedules/collections.json like this:
 *
 *   {
 *     "script_name": "example-health.spec.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "playwright"
 *   }
 *
 * The runner passes MONITOR_BASE_URL and MONITOR_ENV_FILE as env vars.
 * If MONITOR_BASE_URL is not set, falls back to http://localhost:8080.
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";

test.describe("Application Health Checks", () => {
    test("dashboard page loads successfully", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/dashboard`);
        expect(response.status()).toBe(200);
    });

    test("config API returns environments", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/config`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty("environments");
        expect(data.environments.length).toBeGreaterThan(0);
    });

    test("results API is reachable", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/results/dev/`);
        expect(response.status()).toBe(200);
    });
});
