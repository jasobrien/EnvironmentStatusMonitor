/**
 * dashboard.test.js
 *
 * Supertest suite: dashboard page route checks.
 * Shows up on the dashboard as the key "dashboard".
 *
 * Schedule entry:
 *   {
 *     "script_name": "dashboard.test.js",
 *     "environment_name": "envstatus_dev.json",
 *     "Active": "1",
 *     "runner": "supertest"
 *   }
 */

const supertest = require("supertest");
const assert = require("assert");

const BASE_URL = process.env.MONITOR_BASE_URL || "http://localhost:8080";
const request = supertest(BASE_URL);

describe("Dashboard Routes", function () {
    it("GET /dashboard returns 200", async function () {
        const res = await request.get("/dashboard");
        assert.strictEqual(res.status, 200);
    });

    it("GET /dashboard/manage returns 200", async function () {
        const res = await request.get("/dashboard/manage");
        assert.strictEqual(res.status, 200);
    });

    it("GET /dashboard/config returns 200", async function () {
        const res = await request.get("/dashboard/config");
        assert.strictEqual(res.status, 200);
    });

    it("GET /dashboard/performance/dev/1 returns 200", async function () {
        const res = await request.get("/dashboard/performance/dev/1");
        assert.strictEqual(res.status, 200);
    });

    it("GET /dashboard/view/default returns 200", async function () {
        const res = await request.get("/dashboard/view/default");
        assert.strictEqual(res.status, 200);
    });
});
