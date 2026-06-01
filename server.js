const fn = require("./functions");
const influx = require("./influx");
const cf = require("./config/config");
const { pruneHistoryFiles } = require("./scripts/retention");
const { notify } = require("./notifiers");
const constants = require("./config/constants");
const dashboardRoute = require("./routes/dashboards");
const dataRoute = require("./routes/data");
const deployRoute = require("./routes/deploy");
const uploadRoute = require("./routes/upload");
const authRoute = require("./routes/auth");
const apiConfigRoute = require("./routes/api-config");
const apiDashboardsRoute = require("./routes/api-dashboards");
const resultsRoute = require("./routes/results");
const { globalErrorHandler, asyncHandler } = require("./middleware/errorHandler");
const { getRunner, listRunners } = require("./runners");
const CronJob = require("cron").CronJob;
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

// Setup config
const config = cf.config;
const { ExtendedLog, ResultFileSuffix, HistoryFilePrefix, everyMinute, every10Minutes, Every15, Every5, Every30, Every60, every6hours, ResultsFolder, Influx, session: SESSION_ON, CronLocation, FeatureTestsFolder } = config;
// Support both new generic names and legacy Postman-prefixed names
const ScriptFolder = config.ScriptFolder || config.PostmanCollectionFolder;
const EnvironmentFolder = config.EnvironmentFolder || config.PostmanEnvFolder;
const DataFolder = config.DataFolder || config.PostmanDataFolder;
const DefaultRunner = config.DefaultRunner || 'newman';

const server = express();
server.use(helmet({ contentSecurityPolicy: false }));
server.use(bodyParser.urlencoded({ extended: true, limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));
server.use(bodyParser.json({ limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));
server.use(express.static(path.join(__dirname, "public")));
server.use(express.text({ limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));

if (SESSION_ON) {
    const session_secret = process.env.SECRET;
    if (!session_secret) {
        throw new Error('SESSION_SECRET environment variable must be set when session is enabled');
    }
    const isProd = process.env.NODE_ENV === 'production';
    server.use(session({
        secret: session_secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax'
        }
    }));
}

const influxToken = Influx ? process.env.INFLUXDB_TOKEN : null;
if (Influx && !influxToken) {
    fn.logOutput("Warning", "INFLUXDB_TOKEN not set but Influx is enabled");
}

fn.logOutput("Info", "Server Running");

// Express routes
server.use("/dashboard", dashboardRoute);
server.use("/data", dataRoute);
server.use("/readyToDeploy", deployRoute);
server.use("/upload", uploadRoute);
server.use("/", authRoute);
server.use("/", apiConfigRoute);
server.use("/", apiDashboardsRoute);
server.use("/", resultsRoute);

// ── Runner API endpoint ───────────────────────────────────────
server.get("/api/runners", (req, res) => {
    res.json(listRunners());
});

// ── Health + readiness endpoints ───────────────────────────────
// /healthz — lightweight liveness probe; always returns 200 if the process is up
server.get('/healthz', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// /readyz — readiness probe; checks that the results folder is accessible
server.get('/readyz', (req, res) => {
    const issues = [];
    try {
        fs.accessSync(path.resolve(ResultsFolder), fs.constants.R_OK | fs.constants.W_OK);
    } catch {
        issues.push('results folder not accessible');
    }
    if (issues.length > 0) {
        return res.status(503).json({ status: 'not ready', issues });
    }
    res.json({ status: 'ok', cronJobs: cronJobs.length });
});

// Dynamic test run routes for all environments
config.environments.forEach((env, index) => {
    const routePath = `/run${env.name}`;
    server.get(routePath, asyncHandler(async (req, res) => {
        fn.logOutput("Info", `Running tests for ${env.displayName} environment`);
        const result = await runTests(index, env.id);
        fn.logOutput("Info", `Result : ${result}`);
        res.redirect("/");
    }));
    fn.logOutput("Info", `Test route created: ${routePath}`);
});

// Dynamic cron jobs — one job per (environment × schedule) pair.
// cronJobs is declared here so rebuildCronJobs() and /readyz can both access it.
const cronJobs = [];

/**
 * (Re)build all cron jobs from the current collections.json.
 * Safe to call at runtime — stops existing jobs before creating new ones.
 */
function rebuildCronJobs() {
    cronJobs.forEach(job => job.stop());
    cronJobs.length = 0;

    if (!config.environments || config.environments.length === 0) return;

    let scheduleData;
    try {
        scheduleData = JSON.parse(fs.readFileSync(`${FeatureTestsFolder}collections.json`));
    } catch (e) {
        fn.logOutput("Warning", `Could not read collections.json: ${e.message}. No cron jobs created.`);
        return;
    }

    config.environments.forEach((env, index) => {
        const envTests = scheduleData?.ENV?.[index]?.tests?.filter(t => t.Active == 1) || [];
        const uniqueSchedules = envTests.length > 0
            ? [...new Set(envTests.map(t => t.schedule || "everyMinute"))]
            : ["everyMinute"];
        uniqueSchedules.forEach(scheduleKey => {
            const cronExpr = config[scheduleKey] || everyMinute;
            const job = new CronJob(cronExpr, () => runTests(index, env.id, scheduleKey), null, true, CronLocation);
            cronJobs.push(job);
            fn.logOutput("Info", `Cron job created for env: ${env.id}, schedule: ${scheduleKey} (${cronExpr})`);
        });
    });
    fn.logOutput("Info", `Cron jobs rebuilt — ${cronJobs.length} active`);
}

rebuildCronJobs();

// Daily retention pruning at midnight (no-op when HistoryRetentionDays is not set)
new CronJob("0 0 0 * * *", pruneHistoryFiles, null, true, CronLocation);

// Hot-reload: rebuild cron jobs whenever collections.json is saved
let _reloadDebounce;
fs.watch(`${FeatureTestsFolder}collections.json`, () => {
    clearTimeout(_reloadDebounce);
    _reloadDebounce = setTimeout(() => {
        fn.logOutput("Info", "collections.json changed — rebuilding cron jobs");
        rebuildCronJobs();
    }, 500);
});

async function runTests(region, envId, scheduleKey) {
    const testdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
    const schedule = JSON.parse(testdata);

    if (!schedule.ENV[region]) {
        fn.logOutput("Warning", `No test collection configured for environment index ${region}. Skipping.`);
        return "No tests configured for this environment.";
    }

    const tests = schedule.ENV[region].tests;
    // Only run tests that belong to this cron's schedule slot
    const activeTests = tests.filter(t =>
        t.Active == 1 && (!scheduleKey || (t.schedule || "everyMinute") === scheduleKey)
    );
    fn.logOutput("Total number of test objects", tests.length);
    fn.logOutput("Total number of active test objects", activeTests.length);

    // Group active tests by runner for concurrent execution
    const runnerGroups = {};
    activeTests.forEach(testConfig => {
        const runnerName = testConfig.runner || DefaultRunner;
        if (!runnerGroups[runnerName]) runnerGroups[runnerName] = [];
        runnerGroups[runnerName].push(testConfig);
    });

    // Run each runner group concurrently; tests within a group run sequentially
    // Each runner clears and writes only its own file
    const groupPromises = Object.entries(runnerGroups).map(([runnerName, groupTests]) => {
        return (async () => {
            const runnerFilename = fn.getRunnerResultFileName(envId, runnerName);
            fn.clearCurrentLog(runnerFilename);
            for (const testConfig of groupTests) {
                const script = `${ScriptFolder}${testConfig.script_name}`;
                const envfile = testConfig.environment_name ? `${EnvironmentFolder}${testConfig.environment_name}` : "";
                const datafile = testConfig.datafile ? `${DataFolder}${testConfig.datafile}` : "";
                await runMyTest(script, envfile, schedule.ENV[region], datafile, runnerFilename, runnerName);
                const log = `${fn.myDateTime()},${testConfig.script_name},${testConfig.environment_name},${runnerName}`;
                fn.writeToCurrentLog(JSON.stringify(log) + "\n", 'logs');
                fn.logOutput("Info", `Log : ${log}`);
            }
        })();
    });

    const results = await Promise.allSettled(groupPromises);
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            const rName = Object.keys(runnerGroups)[i];
            fn.logOutput("Error", `Runner group "${rName}" failed: ${r.reason}`);
        }
    });

    return "Tests completed successfully.";
}

/**
 * Assert that a resolved file path stays within its expected base folder.
 * Throws (and logs) if the path escapes the folder — prevents path traversal.
 */
function assertWithinFolder(filePath, baseFolder, label) {
    const resolved = path.resolve(filePath);
    const base = path.resolve(baseFolder);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
        throw new Error(`Path traversal blocked for ${label}: "${filePath}" escapes allowed folder "${baseFolder}"`);
    }
}

async function runMyTest(script, environmentfile, environmentName, datafile, filename, runnerName) {
    try {
        // Validate each path stays within its expected folder (prevents path traversal
        // via malicious collections.json entries).
        assertWithinFolder(script, ScriptFolder, 'script');
        if (environmentfile) assertWithinFolder(environmentfile, EnvironmentFolder, 'environment');
        if (datafile) assertWithinFolder(datafile, DataFolder, 'datafile');

        const runner = getRunner(runnerName);
        const result = await runner.run({
            script,
            environment: environmentfile || undefined,
            datafile: datafile || undefined
        });

        result.executionNames.forEach(name => fn.logOutput("Info", `Test executed: ${name}`));
        const scriptParts = script.split("/");
        const myKey = scriptParts[scriptParts.length - 1].split(".")[0];
        const failedTestCount = result.failedTests;
        const totalTestCount = result.totalTests;
        const FailRate = fn.calculatePercentage(failedTestCount, totalTestCount);
        const statusString = fn.RAG(100 - FailRate);
        const runTiming = result.avgResponseTime;
        const IncludeInStats = statusString !== "Green" ? 0 : 1;
        const RemoveComment = statusString !== "Green" ? "Test failures have distorted timing." : "";

        const testResult = {
            DateTime: fn.myDateTime(),
            Environment: environmentName.Name,
            key: myKey,
            value: statusString,
            TestCount: totalTestCount,
            FailedTestCount: failedTestCount,
            AvgResponseTime: runTiming,
            IncludeInStats,
            RemoveComment,
            runner: runnerName
        };

        fn.CreateJsonObjectForResults(testResult);
        fn.logOutput("Info", `Filename is ${filename}`);
        if (Influx) influx.write(testResult, influxToken);
        fn.writeToCurrentLog(JSON.stringify(testResult) + "\n", filename);
        fn.writeHistoryLogs(JSON.stringify(testResult) + "\n", `hist_${filename}`);
        fn.logOutput("Info", `${FailRate} % failed`);
        fn.logOutput("Info", `RAG Status ${statusString}`);
        if (ExtendedLog) fn.writeToCurrentLog(JSON.stringify(result.rawResult) + "\n", `_ExtendedLog_${filename}`);

        // Fire configured notifiers (non-blocking — errors are logged, not thrown)
        notify(testResult, config.Notifiers || []).catch(err =>
            fn.logOutput("Error", `Notification failed: ${err.message}`)
        );
    } catch (err) {
        fn.logOutput("Error", `Runner "${runnerName}" error: ${err.message}`);
    }
}

const port = process.env.PORT || 8080;

function keepAlive() {
    server.listen(port, () => {
        console.log(`Server is running and listening on http://localhost:${port}`);
    });
}

// Global error handler - must be last
server.use(globalErrorHandler);

if (require.main === module) {
    keepAlive(); // Automatically start the server if this file is run directly
}

module.exports = keepAlive;
module.exports.app = server;
