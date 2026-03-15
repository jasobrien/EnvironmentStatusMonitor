const { execFile } = require("child_process");
const path = require("path");

/**
 * Supertest/Mocha test runner adapter
 * Runs Mocha test files that use Supertest for HTTP assertions against the running server.
 *
 * Expects script_name to be a Mocha test file (e.g. "../../../tests/supertest/collections-supertest.test.js")
 * No environment file is needed — tests connect directly to http://localhost:PORT.
 */
module.exports = {
    run(options) {
        return new Promise((resolve, reject) => {
            const mochaBin = path.join(__dirname, '..', 'node_modules', '.bin', 'mocha');
            const args = [options.script, '--exit', '--timeout', '30000'];
            const startTime = Date.now();

            execFile(mochaBin, args, { timeout: 120000 }, (err, stdout, stderr) => {
                if (err && err.killed) {
                    return reject(new Error("Supertest execution timed out"));
                }

                const result = parseMochaOutput(stdout || "", stderr || "", err);
                result.avgResponseTime = result.totalTests > 0
                    ? Math.round((Date.now() - startTime) / Math.max(result.totalTests, 1))
                    : 0;

                resolve(result);
            });
        });
    }
};

/**
 * Parse Mocha spec reporter output into a standardised result.
 * Looks for summary lines:  "N passing (Xms)"  and  "N failing"
 */
function parseMochaOutput(stdout, stderr, err) {
    const output = stdout + "\n" + stderr;
    const lines = output.split("\n");

    let passing = 0;
    let failing = 0;
    const executionNames = [];

    for (const line of lines) {
        const trimmed = line.trim();

        const passMatch = trimmed.match(/^(\d+) passing/);
        if (passMatch) passing = parseInt(passMatch[1], 10);

        const failMatch = trimmed.match(/^(\d+) failing/);
        if (failMatch) failing = parseInt(failMatch[1], 10);

        // Collect test titles (lines with ✔ or ✗ / number prefix for failures)
        if (/^[✔✓]/.test(trimmed) || /^\d+\)/.test(trimmed)) {
            executionNames.push(trimmed);
        }
    }

    const totalTests = passing + failing;

    if (totalTests === 0 && err) {
        return {
            passed: false,
            totalTests: 1,
            failedTests: 1,
            executionNames: ["Supertest execution error: " + (err.message || "unknown")],
            rawResult: { stdout, stderr, exitCode: err.code }
        };
    }

    return {
        passed: failing === 0,
        totalTests,
        failedTests: failing,
        executionNames,
        rawResult: { stdout, exitCode: err ? err.code : 0 }
    };
}
