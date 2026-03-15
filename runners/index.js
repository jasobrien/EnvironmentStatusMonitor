/**
 * Runner Adapter Interface
 * 
 * All test runner adapters must implement the `run` method:
 * 
 *   run(options) => Promise<RunnerResult>
 * 
 * options: {
 *   script:      string  - path to test script/collection
 *   environment: string  - path to environment file (optional)
 *   datafile:    string  - path to data file (optional)
 * }
 * 
 * RunnerResult: {
 *   passed:          boolean  - overall pass/fail
 *   totalTests:      number   - total assertion/test count
 *   failedTests:     number   - failed assertion/test count
 *   avgResponseTime: number   - average response time in ms (0 if N/A)
 *   executionNames:  string[] - names of executed items (for logging)
 *   rawResult:       any      - full result object for extended logging
 * }
 */

const runners = {};

/**
 * Register a runner adapter
 * @param {string} name - Runner name (e.g. "newman", "bruno", "playwright")
 * @param {object} adapter - Adapter object with a `run` method
 */
function register(name, adapter) {
    if (!adapter || typeof adapter.run !== 'function') {
        throw new Error(`Runner adapter "${name}" must have a run() method`);
    }
    runners[name.toLowerCase()] = adapter;
}

/**
 * Get a runner adapter by name
 * @param {string} name - Runner name
 * @returns {object} adapter
 */
function getRunner(name) {
    const runner = runners[name.toLowerCase()];
    if (!runner) {
        const available = Object.keys(runners).join(', ');
        throw new Error(`Unknown test runner "${name}". Available runners: ${available}`);
    }
    return runner;
}

/**
 * List all registered runner names
 * @returns {string[]}
 */
function listRunners() {
    return Object.keys(runners);
}

// Register built-in adapters
register('newman', require('./newman'));
register('bruno', require('./bruno'));
register('playwright', require('./playwright'));
register('supertest', require('./supertest'));

module.exports = { register, getRunner, listRunners };
