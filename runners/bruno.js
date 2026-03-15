const { execFile } = require("child_process");
const path = require("path");

/**
 * Bruno CLI test runner adapter
 * Requires @usebruno/cli to be installed (already a project dependency)
 * 
 * Expects script_name to be a Bruno collection directory path within the collections folder.
 * Environment files should be Bruno environment JSON files.
 */
module.exports = {
    run(options) {
        return new Promise((resolve, reject) => {
            // Bruno must be run with cwd set to the collection root directory.
            const collectionDir = path.resolve(options.script);
            const args = ["run"];

            if (options.environment) {
                // Bruno uses named environments (e.g. "local"), not file paths.
                // Extract just the basename without extension in case a file path was passed.
                const envName = path.basename(options.environment, path.extname(options.environment));
                args.push("--env", envName);
            }

            const bruPath = path.join(__dirname, '..', 'node_modules', '.bin', 'bru');
            const startTime = Date.now();

            execFile(bruPath, args, { cwd: collectionDir, timeout: 120000 }, (err, stdout, stderr) => {
                if (err && err.killed) {
                    return reject(new Error("Bruno test execution timed out"));
                }

                // Bruno CLI outputs results to stdout; parse them
                const result = parseBrunoOutput(stdout || "", err);
                result.avgResponseTime = result.totalTests > 0
                    ? Math.round((Date.now() - startTime) / Math.max(result.totalTests, 1))
                    : 0;

                resolve(result);
            });
        });
    }
};

/**
 * Parse Bruno CLI stdout into a standardized result
 */
function parseBrunoOutput(stdout, err) {
    const lines = stdout.split("\n");

    let totalTests = 0;
    let failedTests = 0;
    const executionNames = [];

    for (const line of lines) {
        // Bruno outputs lines like: "✓ Request Name (200 OK)" or "✗ Request Name"
        const passMatch = line.match(/✓\s+(.+)/);
        const failMatch = line.match(/✗\s+(.+)/);

        if (passMatch) {
            totalTests++;
            executionNames.push(passMatch[1].trim());
        } else if (failMatch) {
            totalTests++;
            failedTests++;
            executionNames.push(failMatch[1].trim());
        }

        // Also check for summary lines like "Tests:    X passed, Y failed, Z total"
        const summaryMatch = line.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/i);
        if (summaryMatch) {
            totalTests = parseInt(summaryMatch[3], 10);
            failedTests = parseInt(summaryMatch[2], 10);
        }
    }

    // If Bruno exited with error and we found no tests, count it as 1 failed
    if (err && totalTests === 0) {
        totalTests = 1;
        failedTests = 1;
        executionNames.push("Bruno execution error");
    }

    return {
        passed: failedTests === 0,
        totalTests,
        failedTests,
        avgResponseTime: 0,
        executionNames,
        rawResult: { stdout, exitCode: err ? err.code : 0 }
    };
}

module.exports.parseBrunoOutput = parseBrunoOutput;
