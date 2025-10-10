const fs = require("fs");
const cf = require("./config/config");

const config = cf.config;
const { ResultFileSuffix, ENV1, ENV2, ENV3, HistoryFilePrefix, ResultsFolder, log } = config;
const Env1NameResultFileName = `${ENV1}${ResultFileSuffix}`;
const Env2NameResultFileName = `${ENV2}${ResultFileSuffix}`;
const Env3NameResultFileName = `${ENV3}${ResultFileSuffix}`;
const Env1NameResultHistFileName = `${HistoryFilePrefix}${ENV1}${ResultFileSuffix}`;
const Env2NameResultHistFileName = `${HistoryFilePrefix}${ENV2}${ResultFileSuffix}`;
const Env3NameResultHistFileName = `${HistoryFilePrefix}${ENV3}${ResultFileSuffix}`;

exports.myDateTime = function () {
  return new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
};

exports.logOutput = function (type, output) {
  if (log === 1) {
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
  if (percentage === 100) return "Green";
  if (percentage >= 90) return "Amber";
  if (percentage < 90) return "Red";
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
  switch (ResultsEnv) {
    case ENV1:
      return Env1NameResultHistFileName;
    case ENV2:
      return Env2NameResultHistFileName;
    case ENV3:
      return Env3NameResultHistFileName;
    default:
      console.log("Error: No correct environment file was called. Dev used as default");
      return Env1NameResultHistFileName;
  }
};

exports.getResultFileName = function (ResultsEnv) {
  switch (ResultsEnv) {
    case ENV1:
      return Env1NameResultFileName;
    case ENV2:
      return Env2NameResultFileName;
    case ENV3:
      return Env3NameResultFileName;
    default:
      console.log("Error: No correct environment file was called. Dev used as default");
      return Env1NameResultFileName;
  }
};
