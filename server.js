const fn = require("./functions");
const influx = require("./influx");
const cf = require("./config/config");
const constants = require("./config/constants");
const dashboardRoute = require("./routes/dashboards");
const dataRoute = require("./routes/data");
const deployRoute = require("./routes/deploy");
const uploadRoute = require("./routes/upload");
const { validateEnvironment } = require("./middleware/validation");
const { globalErrorHandler, asyncHandler } = require("./middleware/errorHandler");
const { requireAuth } = require("./middleware/auth");
const newman = require("newman");
const CronJob = require("cron").CronJob;
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

// Setup config
const config = cf.config;
const { ExtendedLog, ResultFileSuffix, HistoryFilePrefix, everyMinute, every10Minutes, Every15, Every5, Every30, Every60, every6hours, ResultsFolder, PostmanCollectionFolder, PostmanEnvFolder, PostmanDataFolder, Influx, session: SESSION_ON, user, password, CronLocation, FeatureTestsFolder } = config;

const server = express().use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true, limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));
server.use(bodyParser.json({ limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));
server.use(express.static(path.join(__dirname, "public")));
server.use(express.text({ limit: constants.UPLOAD_LIMITS.MAX_FILE_SIZE }));

if (SESSION_ON) {
    const session_secret = process.env.SECRET;
    if (!session_secret) {
        throw new Error('SESSION_SECRET environment variable must be set when session is enabled');
    }
    server.use(session({
        secret: session_secret,
        resave: true,
        saveUninitialized: true
    }));
}

if (Influx) {
    const token = process.env.INFLUXDB_TOKEN;
    if (!token) {
        fn.logOutput("Warning", "INFLUXDB_TOKEN not set but Influx is enabled");
    }
}

fn.logOutput("Info", "Server Running");

// Express routes
server.use("/dashboard", dashboardRoute);
server.use("/data", dataRoute);
server.use("/readyToDeploy", deployRoute);
server.use("/upload", uploadRoute);
server.get("/config", (req, res) => {
    // Return web config plus environment configuration for dashboard
    const dashboardConfig = {
        ...config.web,
        environments: config.environments || []
    };
    res.send(dashboardConfig);
});

// Configuration management API endpoints
server.get("/api/config", requireAuth, (req, res) => {
    try {
        res.json(config);
    } catch (error) {
        console.error('Error reading configuration:', error);
        res.status(500).json({ error: 'Failed to read configuration' });
    }
});

server.post("/api/config", requireAuth, (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const newConfig = req.body;
        
        // Merge with existing config to preserve structure
        const updatedConfig = { ...config, ...newConfig };
        
        // Update the in-memory config
        Object.assign(config, updatedConfig);
        
        // Write to config file
        const configPath = path.join(__dirname, 'config', 'config.js');
        const configContent = `exports.config = ${JSON.stringify(updatedConfig, null, 2)};`;
        
        fs.writeFileSync(configPath, configContent, 'utf8');
        
        fn.logOutput("Info", "Configuration updated successfully");
        res.json({ success: true, message: 'Configuration updated successfully' });
        
    } catch (error) {
        console.error('Error updating configuration:', error);
        fn.logOutput("Error", `Configuration update failed: ${error.message}`);
        res.status(500).json({ error: 'Failed to update configuration', details: error.message });
    }
});

server.get('/', (req, res) => {
    if (SESSION_ON) {
        res.sendFile(path.join(__dirname, 'pages', 'login.html'));
    } else {
        res.redirect('/dashboard');
    }
});

server.get("/username", (req, res) => {
    if (req.session.loggedin) {
        res.send(req.session.username);
    } else {
        res.send("Not logged in");
    }
});

server.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user && password === password) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/dashboard');
    } else {
        res.send('Invalid username or password');
    }
});

server.get('/check-login', (req, res) => {
    if (SESSION_ON) {
        res.json({ loggedin: req.session.loggedin || false });
    } else {
        res.json({ loggedin: false });
    }
});

server.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

server.get("/histresults/:ResultsEnv/:key", (req, res) => {
    const { ResultsEnv, key: myKey } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    res.send(data_filter);
});

server.get("/histresultsdays/:ResultsEnv/:key/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey, days: numDays } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - (numDays === "All" ? 1000 : numDays) * 24 * 60 * 60 * 1000;
    const graphHistory = data_filter.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    res.send(graphHistory);
});

server.get("/histresults/:ResultsEnv/:key/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey, days: numDays } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
    const graphHistory = data_filter.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    res.send(graphHistory);
});

function parseIso8601Datetime(isoString) {
    return new Date(isoString);
}

server.get("/histresultskeys/:ResultsEnv", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const distinctTrans = Array.from(new Set(results.map(trans => trans.key)));
    res.send(distinctTrans);
});

server.get("/results/:ResultsEnv/", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getResultFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    res.send(results);
});

server.get("/getStats/:ResultsEnv/:key", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const data = results.filter(element => element.key == myKey);
    const stats = fn.calculateStatusCounts(data);
    res.send({ Feature: myKey, ...stats });
});

server.get("/getSummaryStats/:ResultsEnv", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const stats = fn.calculateStatusCounts(results);
    res.send({ Environment: ResultsEnv, ...stats });
});

server.get("/getSummaryStats/:ResultsEnv/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, days: numDays } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const filename = fn.getHistFileName(ResultsEnv);
    const results = fn.createJsonArrayFromFile(filename);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
    const data = results.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    const stats = fn.calculateStatusCounts(data);
    res.send({ Environment: ResultsEnv, ...stats });
});

// Dynamic test run routes for all environments
config.environments.forEach((env, index) => {
    const routePath = `/run${env.name}`;
    server.get(routePath, asyncHandler(async (req, res) => {
        const filename = `${env.id}results`;
        fn.logOutput("Info", `Running tests for ${env.displayName} environment`);
        const result = await runTests(index, filename);
        fn.logOutput("Info", `Result : ${result}`);
        res.redirect("/");
    }));
    fn.logOutput("Info", `Test route created: ${routePath}`);
});

// Dynamic cron jobs based on environments configuration
const cronJobs = [];
if (config.environments && config.environments.length > 0) {
    config.environments.forEach((env, index) => {
        const filename = `${env.id}results`;
        const job = new CronJob(everyMinute, () => runTests(index, filename), null, true, CronLocation);
        cronJobs.push(job);
        fn.logOutput("Info", `Cron job created for environment: ${env.id}`);
    });
}

function runTests(region, filename) {
    return new Promise((resolve, reject) => {
        try {
            const testdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
            const schedule = JSON.parse(testdata);
            const totalTests = Object.keys(schedule.ENV[region].tests).length;
            const tests = schedule.ENV[region].tests;
            const filteredTests = Object.keys(tests).filter(key => tests[key].Active == 1);
            fn.logOutput("Total number of test objects", totalTests);
            fn.logOutput("Total number of filtered test objects", filteredTests.length);

            for (let i = 0; i < totalTests; i++) {
                const collection = `${PostmanCollectionFolder}${schedule.ENV[region].tests[i].script_name}`;
                const envfile = schedule.ENV[region].tests[i].environment_name ? `${PostmanEnvFolder}${schedule.ENV[region].tests[i].environment_name}` : "";
                const datafile = schedule.ENV[region].tests[i].datafile ? `${PostmanDataFolder}${schedule.ENV[region].tests[i].datafile}` : "";
                runMyTest(collection, envfile, schedule.ENV[region], datafile, filename);
                const log = `${fn.myDateTime()},${schedule.ENV[region].tests[i].script_name},${schedule.ENV[region].tests[i].environment_name}`;
                fn.writeToCurrentLog(JSON.stringify(log) + "\n", 'logs');
                fn.logOutput("Info", `Log : ${log}`);
            }
            resolve("Tests completed successfully.");
        } catch (error) {
            reject(error);
        }
    });
}

function runMyTest(collection, environmentfile, environmentName, datafile, filename) {
    fn.clearCurrentLog(filename);
    const options = {
        collection,
        reporters: "cli",
        environment: environmentfile || undefined,
        iterationData: datafile || undefined
    };

    newman.run(options, (err, res) => {
        if (err) {
            fn.logOutput("Error", `An error has occurred: ${err}`);
            throw err;
        }
        res.run.executions.forEach(exec => fn.logOutput("Info", `API Request call: ${exec.item.name}`));
        const myCollectionString = collection.split("/");
        const myKey = myCollectionString[2].split(".");
        const failedTestCount = res.run.stats.assertions.failed;
        const totalTestCount = res.run.stats.assertions.total;
        const FailRate = fn.calculatePercentage(failedTestCount, totalTestCount);
        const statusString = fn.RAG(100 - FailRate);
        const runTiming = res.run.timings.responseAverage;
        const IncludeInStats = statusString !== "Green" ? 0 : 1;
        const RemoveComment = statusString !== "Green" ? "Test failures have distorted timing." : "";

        const testResult = {
            DateTime: fn.myDateTime(),
            Environment: environmentName.Name,
            key: myKey[0],
            value: statusString,
            TestCount: totalTestCount,
            FailedTestCount: failedTestCount,
            AvgResponseTime: runTiming,
            IncludeInStats,
            RemoveComment
        };

        fn.CreateJsonObjectForResults(testResult);
        fn.logOutput("Info", `Filename is ${filename}`);
        if (Influx) influx.write(testResult, token);
        fn.writeToCurrentLog(JSON.stringify(testResult) + "\n", filename);
        fn.writeHistoryLogs(JSON.stringify(testResult) + "\n", `hist_${filename}`);
        fn.logOutput("Info", `${FailRate} % failed`);
        fn.logOutput("Info", `RAG Status ${statusString}`);
        if (ExtendedLog) fn.writeToCurrentLog(JSON.stringify(res.run) + "\n", `_ExtendedLog_${filename}`);
    });
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
