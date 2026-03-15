/**
 * deploy.spec.js
 *
 * Scheduled Playwright spec — Deploy / Ready-to-Deploy API health checks.
 * Produces result key "deploy" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/playwright-api/specs/deploy.spec.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "playwright",
 *     "schedule": "Every30"
 *   }
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";

test.describe("Deploy / Ready to Deploy", () => {
    test("GET /readyToDeploy/dev returns 200 with array", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/readyToDeploy/dev`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test("GET /readyToDeploy/dev/:trans returns 200 with array", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/readyToDeploy/dev/env_performance`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test("GET /readyToDeploy/test returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/readyToDeploy/test`);
        expect(response.status()).toBe(200);
    });

    test("GET /readyToDeploy/staging returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/readyToDeploy/staging`);
        expect(response.status()).toBe(200);
    });
});
