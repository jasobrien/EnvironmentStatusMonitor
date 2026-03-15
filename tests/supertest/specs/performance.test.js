/**
 * performance.test.js
 *
 * Supertest suite — Performance page route checks.
 * Produces result key "performance" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/supertest/specs/performance.test.js",
 *     "environment_name": "",
 *     "Active": "1",
 *     "runner": "supertest",
 *     "schedule": "Every30"
 *   }
 */

const supertest = require("supertest");
const assert = require("assert");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";
const request = supertest(BASE_URL);

describe("Performance Page Routes", function () {
    it("GET /dashboard/performance/dev/All returns 200", async function () {
        const res = await request.get("/dashboard/performance/dev/All");
        assert.strictEqual(res.status, 200);
    });

    it("GET /dashboard/performance/dev/30 returns 200", async function () {
        const res = await request.get("/dashboard/performance/dev/30");
        assert.strictEqual(res.status, 200);
    });

    it("performance page contains expected content", async function () {
        const res = await request.get("/dashboard/performance/dev/All");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.includes("Feature Collection Performance"), "Should contain performance content");
    });

    it("GET /getSummaryStats/dev returns stats", async function () {
        const res = await request.get("/getSummaryStats/dev");
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.hasOwnProperty("Green"), "stats should have Green");
        assert.ok(res.body.hasOwnProperty("Total"), "stats should have Total");
    });
});
