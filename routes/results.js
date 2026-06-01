"use strict";

/**
 * Results & statistics routes.
 *
 * Provides read access to current results and historical data files.
 * All routes with an environment parameter are guarded by validateEnvironment.
 *
 *   GET /results/:env/                         — all runners combined
 *   GET /results/:env/:runner/                 — single runner
 *   GET /getStats/:env/:key                    — status counts for one key
 *   GET /getSummaryStats/:env                  — overall summary
 *   GET /getSummaryStats/:env/:days            — summary over N days
 *   GET /getSummaryStats/:env/:runner/:days    — per-runner summary over N days
 *   GET /histresults/:env/:key                 — history for one key
 *   GET /histresults/:env/:key/:days           — history for one key over N days
 *   GET /histresultsdays/:env/:key/:days       — alias with "All" days support
 *   GET /histresultskeys/:env                  — distinct test keys in history
 */

const express = require("express");
const router = express.Router();
const fn = require("../functions");
const { validateEnvironment } = require("../middleware/validation");

function parseIso8601Datetime(isoString) {
    return new Date(isoString);
}

router.get("/results/:ResultsEnv/", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerResultFiles(ResultsEnv);
    res.send(results);
});

router.get("/results/:ResultsEnv/:runner/", validateEnvironment, (req, res) => {
    const { ResultsEnv, runner } = req.params;
    const results = fn.createJsonArrayFromFile(fn.getRunnerResultFileName(ResultsEnv, runner));
    res.send(results);
});

router.get("/getStats/:ResultsEnv/:key", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerHistFiles(ResultsEnv);
    const data = results.filter(element => element.key == myKey);
    const stats = fn.calculateStatusCounts(data);
    res.send({ Feature: myKey, ...stats });
});

router.get("/getSummaryStats/:ResultsEnv", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerHistFiles(ResultsEnv);
    const stats = fn.calculateStatusCounts(results);
    res.send({ Environment: ResultsEnv, ...stats });
});

router.get("/getSummaryStats/:ResultsEnv/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, days: numDays } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerHistFiles(ResultsEnv);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
    const data = results.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    const stats = fn.calculateStatusCounts(data);
    res.send({ Environment: ResultsEnv, ...stats });
});

router.get("/getSummaryStats/:ResultsEnv/:runner/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, runner, days: numDays } = req.params;
    const results = fn.createJsonArrayFromFile(fn.getRunnerHistFileName(ResultsEnv, runner));
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
    const data = results.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    const stats = fn.calculateStatusCounts(data);
    res.send({ Environment: ResultsEnv, Runner: runner, ...stats });
});

router.get("/histresults/:ResultsEnv/:key", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerHistFiles(ResultsEnv);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    res.send(data_filter);
});

router.get("/histresults/:ResultsEnv/:key/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey, days: numDays } = req.params;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = fn.readAllRunnerHistFiles(ResultsEnv);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
    const graphHistory = data_filter.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    res.send(graphHistory);
});

router.get("/histresultsdays/:ResultsEnv/:key/:days", validateEnvironment, (req, res) => {
    const { ResultsEnv, key: myKey, days: numDays } = req.params;
    const { runner } = req.query;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = runner
        ? fn.createJsonArrayFromFile(fn.getRunnerHistFileName(ResultsEnv, runner))
        : fn.readAllRunnerHistFiles(ResultsEnv);
    const data_filter = results.filter(element => element.key == myKey && element.IncludeInStats == 1);
    const now = new Date();
    const DaysAgoTimestamp = now.getTime() - (numDays === "All" ? 1000 : numDays) * 24 * 60 * 60 * 1000;
    const graphHistory = data_filter.filter(record => parseIso8601Datetime(record.DateTime).getTime() >= DaysAgoTimestamp);
    res.send(graphHistory);
});

router.get("/histresultskeys/:ResultsEnv", validateEnvironment, (req, res) => {
    const { ResultsEnv } = req.params;
    const { runner } = req.query;
    fn.logOutput("Info", `Environment Passed was : ${ResultsEnv}`);
    const results = runner
        ? fn.createJsonArrayFromFile(fn.getRunnerHistFileName(ResultsEnv, runner))
        : fn.readAllRunnerHistFiles(ResultsEnv);
    const distinctTrans = Array.from(new Set(results.map(trans => trans.key)));
    res.send(distinctTrans);
});

module.exports = router;
