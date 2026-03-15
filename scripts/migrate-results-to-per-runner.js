/**
 * One-time migration: split {env}results.json and hist_{env}results.json
 * into per-runner files: {env}_{runner}.json and hist_{env}_{runner}.json
 *
 * Run once with: node scripts/migrate-results-to-per-runner.js
 * Safe to re-run — existing per-runner files are appended to, not overwritten.
 */

const fs = require('fs');
const path = require('path');
const cf = require('../config/config');

const { ResultsFolder } = cf.config;
const environments = cf.config.environments.map(e => e.id);

let totalMigrated = 0;
let totalSkipped = 0;

function migrateFile(srcFilename, destPrefix) {
    const srcPath = path.join(ResultsFolder, srcFilename + '.json');
    if (!fs.existsSync(srcPath)) {
        console.log(`  skip: ${srcFilename}.json not found`);
        totalSkipped++;
        return;
    }

    const lines = fs.readFileSync(srcPath, 'utf8').split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        console.log(`  skip: ${srcFilename}.json is empty`);
        totalSkipped++;
        return;
    }

    // Group lines by runner field
    const byRunner = {};
    let unparseable = 0;
    for (const line of lines) {
        try {
            const record = JSON.parse(line);
            const runner = record.runner || 'unknown';
            if (!byRunner[runner]) byRunner[runner] = [];
            byRunner[runner].push(line);
        } catch {
            unparseable++;
        }
    }

    if (unparseable > 0) {
        console.log(`  warning: ${unparseable} unparseable lines skipped in ${srcFilename}.json`);
    }

    for (const [runner, runnerLines] of Object.entries(byRunner)) {
        const destFilename = `${destPrefix}_${runner}.json`;
        const destPath = path.join(ResultsFolder, destFilename);
        fs.appendFileSync(destPath, runnerLines.join('\n') + '\n');
        console.log(`  ${srcFilename}.json → ${destFilename}: ${runnerLines.length} records (runner=${runner})`);
        totalMigrated += runnerLines.length;
    }

    // Rename original to .bak so it is preserved but won't conflict
    const bakPath = srcPath + '.bak';
    fs.renameSync(srcPath, bakPath);
    console.log(`  renamed ${srcFilename}.json → ${srcFilename}.json.bak`);
}

console.log('Migrating results files to per-runner format...\n');

for (const envId of environments) {
    console.log(`Environment: ${envId}`);
    migrateFile(`${envId}results`, envId);
    migrateFile(`hist_${envId}results`, `hist_${envId}`);
    console.log('');
}

console.log(`Done. Migrated ${totalMigrated} records, skipped ${totalSkipped} files.`);
console.log('Original files renamed to *.bak — delete them when satisfied with the migration.');
