const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Playwright test runner adapter
 * Requires @playwright/test to be installed
 * 
 * Expects script_name to be a Playwright test file (e.g. "my-tests.spec.js")
 * in the collections folder. Uses JSON reporter for structured output.
 */
module.exports = {
    run(options) {
        return new Promise((resolve, reject) => {
            // Playwright CLI treats path args as glob patterns and does not normalize `../`,
            // so resolve to an absolute path before passing.
            const specFile = path.resolve(options.script);
            const args = [
                "test",
                specFile,
                "--config", path.join(__dirname, "..", "tests", "playwright-api", "schedule.config.js"),
                "--reporter=json"
            ];

            // Pass environment file as env var so tests can read it
            const env = { ...process.env };
            if (options.environment) {
                env.TEST_ENVIRONMENT_FILE = options.environment;
            }
            if (options.datafile) {
                env.TEST_DATA_FILE = options.datafile;
            }

            const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            const startTime = Date.now();

            execFile(npxPath, ['playwright', ...args], {
                timeout: 300000,
                env,
                maxBuffer: 10 * 1024 * 1024
            }, (err, stdout, stderr) => {
                if (err && err.killed) {
                    return reject(new Error("Playwright test execution timed out"));
                }

                const result = parsePlaywrightOutput(stdout || "", err, startTime);
                resolve(result);
            });
        });
    }
};

/**
 * Parse Playwright JSON reporter output into a standardized result
 */
function parsePlaywrightOutput(stdout, err, startTime) {
    let totalTests = 0;
    let failedTests = 0;
    const executionNames = [];
    let rawResult = { stdout, exitCode: err ? err.code : 0 };

    try {
        const report = JSON.parse(stdout);
        rawResult = report;

        if (report.suites) {
            const tests = flattenTests(report.suites);
            totalTests = tests.length;
            for (const test of tests) {
                executionNames.push(test.title);
                if (test.status === 'failed' || test.status === 'timedOut') {
                    failedTests++;
                }
            }
        }
    } catch {
        // JSON parse failed — fall back to exit code
        if (err) {
            totalTests = 1;
            failedTests = 1;
            executionNames.push("Playwright execution error");
        }
    }

    const elapsed = Date.now() - startTime;
    return {
        passed: failedTests === 0,
        totalTests,
        failedTests,
        avgResponseTime: totalTests > 0 ? Math.round(elapsed / totalTests) : 0,
        executionNames,
        rawResult
    };
}

/**
 * Recursively flatten Playwright suites into a flat array of test results
 */
function flattenTests(suites) {
    const tests = [];
    for (const suite of suites) {
        if (suite.specs) {
            for (const spec of suite.specs) {
                if (spec.tests) {
                    for (const test of spec.tests) {
                        const status = test.results && test.results.length > 0
                            ? test.results[test.results.length - 1].status
                            : 'failed';
                        tests.push({ title: spec.title, status });
                    }
                }
            }
        }
        if (suite.suites) {
            tests.push(...flattenTests(suite.suites));
        }
    }
    return tests;
}

module.exports.parsePlaywrightOutput = parsePlaywrightOutput;
module.exports.flattenTests = flattenTests;
