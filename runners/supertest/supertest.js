/**
 * Supertest runner adapter.
 *
 * Runs a Mocha/Supertest test file as a subprocess using
 * `npx mocha --reporter json <specFile>` and converts the
 * Mocha JSON reporter output into the dashboard result format.
 *
 * Schedule entry shape:
 *   {
 *     "script_name": "my-api.test.js",           // file in ./supertest-tests/
 *     "environment_name": "envstatus_dev.json",   // env file, sets MONITOR_BASE_URL
 *     "Active": "1",
 *     "runner": "supertest"
 *   }
 *
 * Environment variables passed to the test process:
 *   MONITOR_ENV_FILE  – absolute path to the environment JSON file
 *   MONITOR_BASE_URL  – base URL extracted from that env file
 */

const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");

/**
 * Parse Mocha JSON reporter output into a simplified stats object.
 * @param {string} jsonOutput  raw stdout from `mocha --reporter json`
 * @returns {{ total: number, failed: number, avgDuration: number }}
 */
function parseMochaOutput(jsonOutput) {
    let report;
    try {
        const jsonStart = jsonOutput.indexOf("{");
        report = JSON.parse(jsonStart >= 0 ? jsonOutput.slice(jsonStart) : jsonOutput);
    } catch {
        return { total: 0, failed: 0, avgDuration: 0 };
    }

    const stats = report.stats || {};
    const total = stats.tests || 0;
    const failed = stats.failures || 0;
    const durationMs = stats.duration || 0;
    const avgDuration = total > 0 ? Math.round(durationMs / total) : 0;

    return { total, failed, avgDuration };
}

/**
 * Run a Mocha/Supertest spec file and return a dashboard result record.
 *
 * @param {object} opts
 * @param {string} opts.specFile          – absolute path to the .test.js file
 * @param {string} opts.envFile           – absolute path to the environment JSON (may be "")
 * @param {string} opts.environmentName   – display name of the environment (e.g. "Dev")
 * @param {string} opts.key               – dashboard key (derived from filename stem)
 * @param {Function} opts.RAG             – (passRate) => "Green"|"Amber"|"Red"
 * @param {Function} opts.calculatePercentage – (failed, total) => number
 * @param {Function} opts.myDateTime      – () => datetime string
 * @returns {Promise<object>}  dashboard result record
 */
function runSupertestSpec(opts) {
    return new Promise((resolve, reject) => {
        const { specFile, envFile, environmentName, key, RAG, calculatePercentage, myDateTime } = opts;

        const env = { ...process.env };

        // Resolve base URL from environment file
        if (envFile) {
            env.MONITOR_ENV_FILE = envFile;
            try {
                const envData = JSON.parse(fs.readFileSync(envFile, "utf8"));
                if (envData.values) {
                    const baseUrlEntry = envData.values.find(
                        v => v.key === "base_url" || v.key === "baseUrl" || v.key === "BASE_URL"
                    );
                    if (baseUrlEntry) env.MONITOR_BASE_URL = baseUrlEntry.value;
                }
            } catch { /* env file not required */ }
        }

        const args = [
            "mocha",
            "--reporter", "json",
            "--timeout", "30000",
            "--exit",
            specFile,
        ];

        execFile("npx", args, { env, cwd: ROOT, timeout: 120000 }, (err, stdout, stderr) => {
            // Mocha exits with code 1 on test failures – that's expected, not a system error
            const output = stdout || stderr || "";
            const stats = parseMochaOutput(output);

            const failedCount = stats.failed;
            const totalCount = stats.total;
            const failRate = totalCount > 0 ? calculatePercentage(failedCount, totalCount) : 0;
            const statusString = RAG(100 - failRate);
            const avgResponseTime = stats.avgDuration;
            const IncludeInStats = statusString !== "Green" ? 0 : 1;
            const RemoveComment = statusString !== "Green" ? "Test failures have distorted timing." : "";

            const result = {
                DateTime: myDateTime(),
                Environment: environmentName,
                key,
                value: statusString,
                TestCount: totalCount,
                FailedTestCount: failedCount,
                AvgResponseTime: avgResponseTime,
                IncludeInStats,
                RemoveComment,
            };

            // A system-level error (e.g. mocha not found) with zero tests parsed = real failure
            if (err && totalCount === 0) {
                return reject(new Error(`Supertest runner failed to execute: ${err.message}\n${output}`));
            }

            resolve(result);
        });
    });
}

module.exports = { runSupertestSpec, parseMochaOutput };
