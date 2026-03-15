const fs = require("fs");
const cf = require("./config/config");

const config = cf.config;
const { ResultFileSuffix, HistoryFilePrefix, ResultsFolder, ExtendedLog, CronLocation, Green, Amber } = config;

exports.myDateTime = function () {
  return new Date().toLocaleString("en-US", { timeZone: CronLocation });
};

exports.logOutput = function (type, output) {
  if (ExtendedLog === true) {
    console.log(`${type}: ${output}`);
  }
};

exports.CreateJsonObjectForResults = function (myobj) {
  return JSON.stringify([myobj]);
};

exports.calculatePercentage = function (partialValue, totalValue) {
  return (100 * partialValue) / totalValue;
};

exports.RAG = function (percentage) {
  if (percentage === Green) return "Green";
  if (percentage >= Amber) return "Amber";
  if (percentage < Amber) return "Red";
  return "Blue"; // Blue means something is wrong with the test
};

exports.createJsonArrayFromFile = function (filename) {
  const myFileName = `${ResultsFolder}${filename}.json`;

  try {
    if (fs.existsSync(myFileName)) {
      console.log("File exists");
      const myfile = fs.readFileSync(myFileName, "utf8");
      fs.stat(myFileName, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
        } else {
          console.log(`${filename} last modified: ${stats.mtime}`);
        }
      });

      const FileArray = myfile.toString().split("\n").filter(line => line.trim() !== "");
      const myArr = FileArray.map(line => JSON.parse(line));

      myArr.sort((a, b) => a.key.toUpperCase().localeCompare(b.key.toUpperCase()));

      return myArr;
    } else {
      console.log("File does not exist");
      return []; // Return empty array instead of undefined
    }
  } catch (err) {
    console.error("Error reading file:", err);
    return []; // Return empty array on error
  }
};

exports.clearCurrentLog = function (filename) {
  const resultsfile = `${ResultsFolder}${filename}.json`;
  try {
    if (fs.existsSync(resultsfile)) {
      fs.unlinkSync(resultsfile);
      console.log(`${resultsfile} Cleared`);
    }
  } catch (err) {
    console.error("Error clearing file:", err);
  }
};

exports.writeToCurrentLog = function (record, filename) {
  const logfile = `${ResultsFolder}${filename}.json`;

  fs.appendFile(logfile, record, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Record Inserted!");
    }
  });
};

// Upsert a result into the current log, replacing any existing entry with the same key.
// Used by the scheduler so that multiple schedule groups for one environment don't overwrite
// each other's results — each key is kept at its latest value only.
exports.upsertResultInLog = function (record, filename) {
  const logfile = `${ResultsFolder}${filename}.json`;
  let incoming;
  try { incoming = JSON.parse(record); } catch (e) { return; }
  try {
    let lines = [];
    if (fs.existsSync(logfile)) {
      lines = fs.readFileSync(logfile, "utf8")
        .split("\n")
        .filter(l => l.trim() !== "")
        .filter(l => { try { return JSON.parse(l).key !== incoming.key; } catch { return true; } });
    }
    lines.push(JSON.stringify(incoming));
    fs.writeFileSync(logfile, lines.join("\n") + "\n");
  } catch (e) {
    console.error("Error upserting result in log:", e);
  }
};

exports.writeHistoryLogs = function (record, filename) {
  const logfile = `${ResultsFolder}${filename}.json`;

  fs.appendFile(logfile, record, (err) => {
    if (err) {
      console.error("Error writing to history log:", err);
    } else {
      console.log("The file was saved!");
    }
  });
};

exports.getHistFileName = function (ResultsEnv) {
  return `${HistoryFilePrefix}${ResultsEnv}${ResultFileSuffix}`;
};

exports.getResultFileName = function (ResultsEnv) {
  return `${ResultsEnv}${ResultFileSuffix}`;
};

// Per-runner file helpers
exports.getRunnerResultFileName = function (envId, runner) {
  return `${envId}_${runner}`;
};

exports.getRunnerHistFileName = function (envId, runner) {
  return `${HistoryFilePrefix}${envId}_${runner}`;
};

// Read and merge all per-runner current result files for an env
exports.readAllRunnerResultFiles = function (envId) {
  const prefix = `${envId}_`;
  try {
    const files = fs.readdirSync(ResultsFolder);
    const matched = files.filter(f =>
      f.startsWith(prefix) && f.endsWith('.json') && !f.startsWith('hist_') && !f.startsWith('_')
    );
    const all = [];
    for (const file of matched) {
      try {
        const lines = fs.readFileSync(`${ResultsFolder}${file}`, 'utf8').split('\n').filter(l => l.trim());
        lines.forEach(l => { try { all.push(JSON.parse(l)); } catch {} });
      } catch {}
    }
    return all.sort((a, b) => a.key.toUpperCase().localeCompare(b.key.toUpperCase()));
  } catch {
    return [];
  }
};

// Read and merge all per-runner history files for an env
exports.readAllRunnerHistFiles = function (envId) {
  const prefix = `${HistoryFilePrefix}${envId}_`;
  try {
    const files = fs.readdirSync(ResultsFolder);
    const matched = files.filter(f => f.startsWith(prefix) && f.endsWith('.json'));
    const all = [];
    for (const file of matched) {
      try {
        const lines = fs.readFileSync(`${ResultsFolder}${file}`, 'utf8').split('\n').filter(l => l.trim());
        lines.forEach(l => { try { all.push(JSON.parse(l)); } catch {} });
      } catch {}
    }
    return all;
  } catch {
    return [];
  }
};

/**
 * Calculate status counts (Green, Amber, Red) from results array
 * @param {Array} results - Array of result objects with 'value' property
 * @returns {Object} Object containing Green, Amber, Red, and Total counts (capitalized for backward compatibility)
 */
exports.calculateStatusCounts = function(results) {
  if (!Array.isArray(results)) {
    return { Green: 0, Amber: 0, Red: 0, Total: 0 };
  }
  
  const green = results.filter(r => r.value === "Green").length;
  const amber = results.filter(r => r.value === "Amber").length;
  const red = results.length - green - amber;
  
  return { 
    Green: green, 
    Amber: amber, 
    Red: red, 
    Total: results.length 
  };
};
