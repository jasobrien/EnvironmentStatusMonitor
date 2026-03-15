/**
 * deploy.test.js
 *
 * Supertest suite — Deploy / Ready-to-Deploy route checks.
 * Produces result key "deploy" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/supertest/specs/deploy.test.js",
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

describe("Deploy / Ready to Deploy Routes", function () {
    it("GET /readyToDeploy/dev returns 200 with array", async function () {
        const res = await request.get("/readyToDeploy/dev");
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body), "Should be an array");
    });

    it("GET /readyToDeploy/dev/:trans returns 200 with array", async function () {
        const res = await request.get("/readyToDeploy/dev/env_performance");
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body), "Should be an array");
    });

    it("GET /readyToDeploy/test returns 200", async function () {
        const res = await request.get("/readyToDeploy/test");
        assert.strictEqual(res.status, 200);
    });

    it("GET /readyToDeploy/staging returns 200", async function () {
        const res = await request.get("/readyToDeploy/staging");
        assert.strictEqual(res.status, 200);
    });
});
