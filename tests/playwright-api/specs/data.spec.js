/**
 * data.spec.js
 *
 * Scheduled Playwright spec — Data API health checks.
 * Produces result key "data" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/playwright-api/specs/data.spec.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "playwright",
 *     "schedule": "Every30"
 *   }
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";

test.describe("Data API", () => {
    test("GET /data/directory returns 200 with array", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/data/directory`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test("GET /data/schedule returns 200", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/data/schedule`);
        expect(response.status()).toBe(200);
    });

    test("GET /data/scheduledata returns 200 with JSON", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/data/scheduledata`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty("name");
        expect(Array.isArray(body.ENV)).toBe(true);
    });

    test("GET /results/dev/ returns 200 with array", async ({ request }) => {
        const response = await request.get(`${BASE_URL}/results/dev/`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });
});
