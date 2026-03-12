const newman = require("newman");

/**
 * Newman (Postman) test runner adapter
 */
module.exports = {
    run(options) {
        return new Promise((resolve, reject) => {
            const newmanOptions = {
                collection: options.script,
                reporters: "cli",
                environment: options.environment || undefined,
                iterationData: options.datafile || undefined
            };

            newman.run(newmanOptions, (err, res) => {
                if (err) {
                    return reject(err);
                }

                resolve({
                    passed: res.run.stats.assertions.failed === 0,
                    totalTests: res.run.stats.assertions.total,
                    failedTests: res.run.stats.assertions.failed,
                    avgResponseTime: res.run.timings.responseAverage,
                    executionNames: res.run.executions.map(exec => exec.item.name),
                    rawResult: res.run
                });
            });
        });
    }
};
