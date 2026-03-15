/**
 * Playwright runner adapter.
 *
 * Runs a single Playwright spec file and converts the JSON reporter output
 * into the same result record format used by the Newman runner so the
 * dashboard can display the results.
 *
 * Schedule entry shape:
 *   {
 *     "script_name": "my-app.spec.js",          // file in ./playwright-tests/
 *     "environment_name": "envstatus_dev.json",  // env file passed as MONITOR_ENV_FILE
 *     "Active": "1",
 *     "runner": "playwright"
 *   }
 *
 * Environment variables passed to the spec process:
 *   MONITOR_ENV_FILE  – absolute path to the environment JSON file
 *   MONITOR_BASE_URL  – base_url from that env file (convenience)
 */

const { execFile } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const ROOT = path.join(__dirname, "../..");

/**
 * Parse Playwright JSON reporter output into a simplified stats object.
 * @param {string} jsonOutput  - raw stdout from `playwright test --reporter=json`
 * @returns {{ total: number, failed: number, avgDuration: number }}
 */
function parsePlaywrightOutput(jsonOutput) {
    let report;
    try {
        // The JSON output may be preceded by other lines; find the first `{`
        const jsonStart = jsonOutput.indexOf("{");
        report = JSON.parse(jsonStart >= 0 ? jsonOutput.slice(jsonStart) : jsonOutput);
    } catch {
        return { total: 0, failed: 0, avgDuration: 0 };
    }

    const stats = report.stats || {};
    const total = (stats.expected || 0) + (stats.unexpected || 0) + (stats.flaky || 0);
    const failed = stats.unexpected || 0;
    const durationMs = stats.duration || 0;
    const avgDuration = total > 0 ? Math.round(durationMs / total) : 0;

    return { total, failed, avgDuration };
}

/**
 * Run a Playwright spec file and return a dashboard result record.
 *
 * @param {object} opts
 * @param {string} opts.specFile     – absolute path to the .spec.js file
 * @param {string} opts.envFile      – absolute path to the environment JSON file (may be "")
 * @param {string} opts.environmentName – display name of the environment (e.g. "Dev")
 * @param {string} opts.key          – dashboard key (derived from spec filename)
 * @param {Function} opts.RAG        – RAG status function (pass, failRate) => "Green"|"Amber"|"Red"
 * @param {Function} opts.calculatePercentage – (failed, total) => number
 * @param {Function} opts.myDateTime – () => datetime string
 * @returns {Promise<object>}  dashboard result record
 */
function runPlaywrightSpec(opts) {
    return new Promise((resolve, reject) => {
        const { specFile, envFile, environmentName, key, RAG, calculatePercentage, myDateTime } = opts;

        const env = { ...process.env };

        // Pass environment file path to the spec so it can configure base URLs etc.
        if (envFile) {
            env.MONITOR_ENV_FILE = envFile;
            try {
                const envData = JSON.parse(fs.readFileSync(envFile, "utf8"));
                if (envData.values) {
                    // Postman-style env file – find base_url variable
                    const baseUrlEntry = envData.values.find(
                        v => v.key === "base_url" || v.key === "baseUrl" || v.key === "BASE_URL"
                    );
                    if (baseUrlEntry) env.MONITOR_BASE_URL = baseUrlEntry.value;
                }
            } catch { /* env file not required to be readable */ }
        }

        // Use a temp file for the JSON report so we don't pollute playwright-report/
        const reportPath = path.join(os.tmpdir(), `pw-report-${Date.now()}.json`);

        const args = [
            "playwright", "test",
            specFile,
            "--config", path.join(__dirname, "schedule.config.js"),
            "--reporter=json",
            `--output=${reportPath}-results`,
        ];

        execFile("npx", args, { env, cwd: ROOT, timeout: 120000 }, (err, stdout, stderr) => {
            // Playwright exits with code 1 when tests fail – that's expected, not an error
            const output = stdout || stderr || "";
            const stats = parsePlaywrightOutput(output);

            // Clean up temp results dir if created
            try { fs.rmSync(`${reportPath}-results`, { recursive: true, force: true }); } catch { /* ignore */ }

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

            // Reject only on unexpected system errors (not test failures)
            if (err && stats.total === 0) {
                return reject(new Error(`Playwright failed to run: ${err.message}\n${output}`));
            }

            resolve(result);
        });
    });
}

module.exports = { runPlaywrightSpec, parsePlaywrightOutput };
