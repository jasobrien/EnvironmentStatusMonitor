const fs = require("fs");
let cf = require("./config/config");

let config = cf.config;
const resultFileSuffix = config.ResultFileSuffix;
const Env1Name = config.ENV1;
const Env2Name = config.ENV2;
const Env3Name = config.ENV3;
const Env1NameResultFileName = Env1Name + config.ResultFileSuffix;
const Env2NameResultFileName = Env2Name + config.ResultFileSuffix;
const Env3NameResultFileName = Env3Name + config.ResultFileSuffix;
const Env1NameResultHistFileName =
  config.HistoryFilePrefix + Env1Name + config.ResultFileSuffix;
const Env2NameResultHistFileName =
  config.HistoryFilePrefix + Env2Name + config.ResultFileSuffix;
const Env3NameResultHistFileName =
  config.HistoryFilePrefix + Env3Name + config.ResultFileSuffix;

const everyMinute = config.everyMinute;
const every10Minutes = config.every10Minutes;
const everyhour = config.everyhour;
const resultsFolder = config.ResultsFolder; //'./results/';
const PostmanCollectionFolder = config.PostmanCollectionFolder; //'./collections/';
const PostmanEnvFolder = config.PostmanEnvFolder; //'./environments/';
const PostmanDataFolder = config.PostmanDataFolder; //'./datafiles/';

exports.myDateTime = function () {
  const now = new Date();
  // return now.toISOString();

  return new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
};

exports.logOutput = function (type, output) {
  if (config.log == 1) {
    console.log(type + ": " + output);
  }
};

exports.CreateJsonObjectForResults = function (myobj) {
  // takes a json string and adds it to an object.
  let myArr = [];
  myArr.push(myobj);
  return JSON.stringify(myArr);
};

exports.calculatePercentage = function (partialValue, totalValue) {
  return (100 * partialValue) / totalValue;
};
//move to functions
exports.RAG = function (percentage) {
  if (percentage == 100)
    //default 100
    return "Green";
  else if (percentage >= 90)
    //default 90
    return "Amber";
  else if (percentage < 90)
    //default 90
    return "Red";
  else return "Blue"; // Blue means something is wrong with the test
};

exports.createJsonArrayFromFile = function (filename) {
  //converts the dev results file into an array to pass to chart.
  console.log("In results file");
  const myFileName = resultsFolder + filename + ".json";

  try {
    if (fs.existsSync(myFileName)) {
      console.log("File exists");
      const myfile = fs.readFileSync(myFileName, "utf8");
      fs.stat(myFileName, function (err, stats) {
        var mtime = stats.mtime;
        console.log(filename + " last modified: " + mtime);
      });

      let FileArray = myfile.toString().split("\n");
      let fileLength = FileArray.length - 1;
      var myArr = [];
      for (let i = 0; i < fileLength; i++) {
        myArr.push(JSON.parse(FileArray[i]));
      }

      const map = new Map();
      myArr.forEach((obj) => {
        map.set(obj.key, obj.value);
      });
      console.log(map.values);

      myArr.sort((a, b) => {
        const keyA = a.key.toUpperCase(); // convert to uppercase for case-insensitive sorting
        const keyB = b.key.toUpperCase(); // convert to uppercase for case-insensitive sorting

        if (keyA < keyB) {
          return -1;
        }
        if (keyA > keyB) {
          return 1;
        }
        return 0; // if keyA equals keyB
      });

      return myArr;
    } else {
      console.log("File does not exist");
    }
  } catch (err) {
    console.error(err);
  }
};

exports.clearCurrentLog = function (filename) {
  let resultsfile = resultsFolder + filename + ".json";

  fs.access(resultsfile, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`${resultsfile} does not exist`);
      return;
    }

    fs.unlink(resultsfile, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(`${resultsfile} Cleared`);
    });
  });
};

exports.writeToCurrentLog = function (record, filename) {
  let logfile = resultsFolder + filename + ".json";

  console.log("File: is " + logfile);
  fs.appendFile(logfile, record, function (err) {
    if (err) {
      console.log("File does not exist : " + logfile);
      return console.log(err);
    }
    console.log("Record Inserted!");
  });
};

exports.writeHistoryLogs = function (record, filename) {
  fs.appendFile(resultsFolder + filename + ".json", record, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
};

exports.getHistFileName = function (ResultsEnv) {
  let filename;
  switch (ResultsEnv) {
    case Env1Name:
      filename = Env1NameResultHistFileName;
      break;
    case Env2Name:
      filename = Env2NameResultHistFileName;
      break;
    case Env3Name:
      filename = Env3NameResultHistFileName;
      break;
    default:
      console.log(
        "Error : No Correct environment file was called.  Dev used as default"
      );
  }
  return filename;
};

exports.getResultFileName = function (ResultsEnv) {
  let filename;
  switch (ResultsEnv) {
    case Env1Name:
      filename = Env1NameResultFileName;
      break;
    case Env2Name:
      filename = Env2NameResultFileName;
      break;
    case Env3Name:
      filename = Env3NameResultFileName;
      break;
    default:
      console.log(
        "Error : No Correct environment file was called.  Dev used as default"
      );
  }
  return filename;
};
