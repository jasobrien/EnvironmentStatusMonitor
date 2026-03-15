/**
 * api-health.test.js
 *
 * Supertest suite: core API health checks.
 * Shows up on the dashboard as the key "api-health".
 *
 * Schedule entry:
 *   {
 *     "script_name": "api-health.test.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "supertest"
 *   }
 *
 * The runner injects MONITOR_BASE_URL from the environment file.
 * Falls back to http://localhost:8080 when run manually.
 */

const supertest = require("supertest");
const assert = require("assert");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";
const request = supertest(BASE_URL);

describe("API Health Checks", function () {
    it("GET /config returns 200 with environments array", async function () {
        const res = await request.get("/config");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body.environments), "environments should be an array");
        assert.ok(res.body.environments.length > 0, "Should have at least one environment");
    });

    it("GET /dashboard returns 200", async function () {
        const res = await request.get("/dashboard");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    it("GET /results/dev/ returns 200 with array", async function () {
        const res = await request.get("/results/dev/");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body), "Results should be an array");
    });

    it("GET /getSummaryStats/dev returns environment stats", async function () {
        const res = await request.get("/getSummaryStats/dev");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(res.body.hasOwnProperty("Total"), "stats should have Total");
        assert.ok(res.body.hasOwnProperty("Green"), "stats should have Green");
    });

    it("GET /api/dashboards returns array", async function () {
        const res = await request.get("/api/dashboards");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body), "Dashboards should be an array");
    });

    it("GET /histresultskeys/dev returns array of keys", async function () {
        const res = await request.get("/histresultskeys/dev");
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.ok(Array.isArray(res.body), "Keys should be an array");
    });
});
