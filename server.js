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
const { runPlaywrightSpec } = require("./runners/playwright/playwright");
const { runSupertestSpec } = require("./runners/supertest/supertest");
const { runNewmanCollection } = require("./runners/newman/newman");
const CronJob = require("cron").CronJob;
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

// Setup config
const config = cf.config;
const { ExtendedLog, ResultFileSuffix, HistoryFilePrefix, everyMinute, every10Minutes, Every15, Every5, Every30, Every60, every6hours, ResultsFolder, PostmanCollectionFolder, PostmanEnvFolder, PostmanDataFolder, Influx, session: SESSION_ON, user, password: configPassword, CronLocation, FeatureTestsFolder } = config;

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
    server.use(session({
        secret: session_secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax'
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
        // Omit credentials from API response
        const { password: _pw, user: _u, ...safeConfig } = config;
        res.json(safeConfig);
    } catch (error) {
        console.error('Error reading configuration:', error);
        res.status(500).json({ error: 'Failed to read configuration' });
    }
});

server.post("/api/config", requireAuth, (req, res) => {
    try {
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

// Dashboard management API endpoints
const dashboardsFilePath = path.join(__dirname, 'config', 'dashboards.json');

function readDashboards() {
    try {
        const data = fs.readFileSync(dashboardsFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return { dashboards: [] };
    }
}

function writeDashboards(data) {
    fs.writeFileSync(dashboardsFilePath, JSON.stringify(data, null, 2), 'utf8');
}

server.get("/api/dashboards", requireAuth, (req, res) => {
    try {
        const data = readDashboards();
        res.json(data.dashboards);
    } catch (error) {
        console.error('Error reading dashboards:', error);
        res.status(500).json({ error: 'Failed to read dashboards' });
    }
});

server.get("/api/dashboards/:id", requireAuth, (req, res) => {
    try {
        const data = readDashboards();
        const dashboard = data.dashboards.find(d => d.id === req.params.id);
        if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
        res.json(dashboard);
    } catch (error) {
        console.error('Error reading dashboard:', error);
        res.status(500).json({ error: 'Failed to read dashboard' });
    }
});

server.post("/api/dashboards", requireAuth, (req, res) => {
    try {
        const { name, description, environments: envs, tests } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Dashboard name is required' });
        }
        const data = readDashboards();
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
        const newDashboard = {
            id,
            name: name.trim(),
            description: (description || '').trim(),
            environments: Array.isArray(envs) ? envs : [],
            tests: Array.isArray(tests) ? tests : [],
            isDefault: false
        };
        data.dashboards.push(newDashboard);
        writeDashboards(data);
        fn.logOutput("Info", `Dashboard created: ${newDashboard.name}`);
        res.status(201).json(newDashboard);
    } catch (error) {
        console.error('Error creating dashboard:', error);
        res.status(500).json({ error: 'Failed to create dashboard' });
    }
});

server.put("/api/dashboards/:id", requireAuth, (req, res) => {
    try {
        const data = readDashboards();
        const idx = data.dashboards.findIndex(d => d.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Dashboard not found' });
        const { name, description, environments: envs, tests } = req.body;
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ error: 'Dashboard name cannot be empty' });
            }
            data.dashboards[idx].name = name.trim();
        }
        if (description !== undefined) data.dashboards[idx].description = (description || '').trim();
        if (envs !== undefined) data.dashboards[idx].environments = Array.isArray(envs) ? envs : [];
        if (tests !== undefined) data.dashboards[idx].tests = Array.isArray(tests) ? tests : [];
        writeDashboards(data);
        fn.logOutput("Info", `Dashboard updated: ${data.dashboards[idx].name}`);
        res.json(data.dashboards[idx]);
    } catch (error) {
        console.error('Error updating dashboard:', error);
        res.status(500).json({ error: 'Failed to update dashboard' });
    }
});

server.delete("/api/dashboards/:id", requireAuth, (req, res) => {
    try {
        const data = readDashboards();
        const idx = data.dashboards.findIndex(d => d.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Dashboard not found' });
        if (data.dashboards[idx].isDefault) {
            return res.status(400).json({ error: 'Cannot delete the default dashboard' });
        }
        const removed = data.dashboards.splice(idx, 1)[0];
        writeDashboards(data);
        fn.logOutput("Info", `Dashboard deleted: ${removed.name}`);
        res.json({ success: true, message: `Dashboard '${removed.name}' deleted` });
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        res.status(500).json({ error: 'Failed to delete dashboard' });
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

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later'
});

server.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    if (username === user && password === configPassword) {
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

server.get("/histresults/:ResultsEnv/:key", validateEnvironment, (req, res) => {
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

// Dynamic cron jobs — one job per (environment × schedule) pair
const cronJobs = [];
if (config.environments && config.environments.length > 0) {
    let scheduleData;
    try {
        scheduleData = JSON.parse(fs.readFileSync(`${FeatureTestsFolder}collections.json`));
    } catch (e) {
        fn.logOutput("Warning", `Could not read collections.json at startup: ${e.message}. Defaulting all jobs to everyMinute.`);
    }
    config.environments.forEach((env, index) => {
        const filename = `${env.id}results`;
        const envTests = scheduleData?.ENV?.[index]?.tests?.filter(t => t.Active == 1) || [];
        const uniqueSchedules = envTests.length > 0
            ? [...new Set(envTests.map(t => t.schedule || "everyMinute"))]
            : ["everyMinute"];
        uniqueSchedules.forEach(scheduleKey => {
            const cronExpr = config[scheduleKey] || everyMinute;
            const job = new CronJob(cronExpr, () => runTests(index, filename, scheduleKey), null, true, CronLocation);
            cronJobs.push(job);
            fn.logOutput("Info", `Cron job created for env: ${env.id}, schedule: ${scheduleKey} (${cronExpr})`);
        });
    });
}

function runTests(region, filename, scheduleKey = "everyMinute") {
    return new Promise((resolve, reject) => {
        try {
            const testdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
            const schedule = JSON.parse(testdata);

            if (!schedule.ENV[region]) {
                fn.logOutput("Warning", `No test collection configured for environment index ${region}. Skipping.`);
                resolve("No tests configured for this environment.");
                return;
            }

            const tests = schedule.ENV[region].tests.filter(
                t => t.Active == 1 && (t.schedule || "everyMinute") === scheduleKey
            );
            fn.logOutput("Info", `Schedule: ${scheduleKey} — ${tests.length} test(s) for env index ${region}`);
            if (tests.length === 0) {
                resolve("No tests assigned to this schedule.");
                return;
            }

            for (let i = 0; i < tests.length; i++) {
                const testEntry = tests[i];
                const runner = (testEntry.runner || "newman").toLowerCase();
                const log = `${fn.myDateTime()},${testEntry.script_name},${testEntry.environment_name}`;
                fn.writeToCurrentLog(JSON.stringify(log) + "\n", 'logs');
                fn.logOutput("Info", `Log : ${log}`);

                if (runner === "playwright") {
                    const specFile = path.resolve(__dirname, "runners/playwright/specs", testEntry.script_name);
                    const envfile = testEntry.environment_name
                        ? path.resolve(__dirname, PostmanEnvFolder, testEntry.environment_name)
                        : "";
                    const stem = path.basename(testEntry.script_name, path.extname(testEntry.script_name));
                    runPlaywrightSpec({
                        specFile,
                        envFile: envfile,
                        environmentName: schedule.ENV[region].Name,
                        key: stem,
                        RAG: fn.RAG,
                        calculatePercentage: fn.calculatePercentage,
                        myDateTime: fn.myDateTime,
                    }).then(result => {
                        fn.CreateJsonObjectForResults(result);
                        fn.logOutput("Info", `Playwright result for ${stem}: ${result.value}`);
                        if (Influx) influx.write(result, influxToken);
                        fn.upsertResultInLog(JSON.stringify(result), filename);
                        fn.writeHistoryLogs(JSON.stringify(result) + "\n", `hist_${filename}`);
                    }).catch(err => fn.logOutput("Error", `Playwright runner error: ${err.message}`));
                } else if (runner === "supertest") {
                    const specFile = path.resolve(__dirname, "runners/supertest/specs", testEntry.script_name);
                    const envfile = testEntry.environment_name
                        ? path.resolve(__dirname, PostmanEnvFolder, testEntry.environment_name)
                        : "";
                    const stem = path.basename(testEntry.script_name, path.extname(testEntry.script_name));
                    runSupertestSpec({
                        specFile,
                        envFile: envfile,
                        environmentName: schedule.ENV[region].Name,
                        key: stem,
                        RAG: fn.RAG,
                        calculatePercentage: fn.calculatePercentage,
                        myDateTime: fn.myDateTime,
                    }).then(result => {
                        fn.CreateJsonObjectForResults(result);
                        fn.logOutput("Info", `Supertest result for ${stem}: ${result.value}`);
                        if (Influx) influx.write(result, influxToken);
                        fn.upsertResultInLog(JSON.stringify(result), filename);
                        fn.writeHistoryLogs(JSON.stringify(result) + "\n", `hist_${filename}`);
                    }).catch(err => fn.logOutput("Error", `Supertest runner error: ${err.message}`));
                } else {
                    // Default: Newman / Postman
                    const collection = `${PostmanCollectionFolder}${testEntry.script_name}`;
                    const envfile = testEntry.environment_name ? `${PostmanEnvFolder}${testEntry.environment_name}` : "";
                    const datafile = testEntry.datafile ? `${PostmanDataFolder}${testEntry.datafile}` : "";
                    const stem = path.basename(testEntry.script_name, path.extname(testEntry.script_name));
                    runNewmanCollection({
                        collection,
                        environmentFile: envfile,
                        dataFile: datafile,
                        environmentName: schedule.ENV[region].Name,
                        key: stem,
                        RAG: fn.RAG,
                        calculatePercentage: fn.calculatePercentage,
                        myDateTime: fn.myDateTime,
                        extendedLog: ExtendedLog,
                    }).then(({ result, run, extendedLog: extended }) => {
                        fn.CreateJsonObjectForResults(result);
                        fn.logOutput("Info", `Newman result for ${stem}: ${result.value}`);
                        if (Influx) influx.write(result, influxToken);
                        fn.upsertResultInLog(JSON.stringify(result), filename);
                        fn.writeHistoryLogs(JSON.stringify(result) + "\n", `hist_${filename}`);
                        if (extended) fn.writeToCurrentLog(JSON.stringify(run) + "\n", `_ExtendedLog_${filename}`);
                    }).catch(err => fn.logOutput("Error", `Newman runner error: ${err.message}`));
                }
            }
            resolve("Tests completed successfully.");
        } catch (error) {
            reject(error);
        }
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
