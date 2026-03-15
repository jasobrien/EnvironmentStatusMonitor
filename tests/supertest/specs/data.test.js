/**
 * data.test.js
 *
 * Supertest suite — Data API route checks.
 * Produces result key "data" in the results file.
 *
 * Schedule entry (schedules/collections.json):
 *   {
 *     "script_name": "../../../tests/supertest/specs/data.test.js",
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

describe("Data API Routes", function () {
    it("GET /data/directory returns 200 with array", async function () {
        const res = await request.get("/data/directory");
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body), "Should be an array");
    });

    it("GET /data/schedule returns 200", async function () {
        const res = await request.get("/data/schedule");
        assert.strictEqual(res.status, 200);
    });

    it("GET /data/scheduledata returns 200 with JSON", async function () {
        const res = await request.get("/data/scheduledata");
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.hasOwnProperty("name"), "Response should have a name field");
        assert.ok(Array.isArray(res.body.ENV), "ENV should be an array");
    });

    it("GET /results/dev/ returns 200 with array", async function () {
        const res = await request.get("/results/dev/");
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body), "Results should be an array");
    });
});
