/**
 * History retention pruning script.
 *
 * Removes NDJSON records older than `HistoryRetentionDays` from every
 * `hist_*.json` file in the results folder.  If `HistoryRetentionDays` is
 * null, zero, or absent the script exits without touching any files.
 *
 * Usage:
 *   node scripts/retention.js            # run once
 *   Scheduled automatically by server.js at midnight every day.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config/config").config;

function pruneHistoryFiles() {
    const days = config.HistoryRetentionDays;
    if (!days || days <= 0) return;

    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const resultsFolder = path.resolve(config.ResultsFolder);

    let files;
    try {
        files = fs.readdirSync(resultsFolder).filter(f => f.startsWith("hist_") && f.endsWith(".json"));
    } catch (e) {
        console.error(`[retention] Cannot read results folder "${resultsFolder}": ${e.message}`);
        return;
    }

    for (const file of files) {
        const filePath = path.join(resultsFolder, file);
        try {
            const raw = fs.readFileSync(filePath, "utf8");
            const lines = raw.split("\n").filter(Boolean);
            const kept = lines.filter(line => {
                try {
                    const record = JSON.parse(line);
                    return new Date(record.DateTime).getTime() >= cutoffMs;
                } catch {
                    return true; // keep unparseable lines
                }
            });
            if (kept.length < lines.length) {
                fs.writeFileSync(filePath, kept.join("\n") + (kept.length ? "\n" : ""), "utf8");
                console.log(`[retention] ${file}: removed ${lines.length - kept.length} records older than ${days} days`);
            }
        } catch (e) {
            console.error(`[retention] Error processing ${file}: ${e.message}`);
        }
    }
}

if (require.main === module) {
    pruneHistoryFiles();
    console.log("[retention] Done.");
}

module.exports = { pruneHistoryFiles };
