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

  fs.access(resultsfile, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`${resultsfile} does not exist`);
      return;
    }

    fs.unlink(resultsfile, (err) => {
      if (err) {
        console.error("Error clearing file:", err);
      } else {
        console.log(`${resultsfile} Cleared`);
      }
    });
  });
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
