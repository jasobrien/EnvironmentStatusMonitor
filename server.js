let fn = require("./functions");
let cf = require("./config/config");
const dashboardRoute = require("./routes/dashboards");
const dataRoute = require("./routes/data");
const deployRoute = require("./routes/deploy");
const newman = require("newman");
const CronJob = require("cron").CronJob;
const express = require("express"); // lightweight web server
const session = require("express-session");
let bodyParser = require("body-parser");
const fs = require("fs");
let path = require("path"); // used for path
const server = express().use(bodyParser.json());
// server.use(
//   bodyParser.urlencoded({
//     extended: true,
//     limit: '10mb', 
//   }),
//   bodyParser.json({ limit: '10mb' })
// );

server.use(bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
}));

server.use(bodyParser.json({
  limit: '10mb'
}));

server.use(session({
  secret: 'VERY_LONG_PASSPHRASE_THAT_WILL_BE_IN_A_MORE_SECURE_PLACE_AND_YOU_SHOULD_CHANGE',
  resave: true,
  saveUninitialized: true
}));
fn.logOutput("Info", "Server Running");
let config = cf.config;
const ExtendedLog= config.ExtendedLog;
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
const every15Minutes = config.Every15;
const every5Minutes = config.Every5;
const every30Minutes = config.Every30;
const everyhour = config.Every60;
const resultsFolder = config.ResultsFolder; //'./results/';
const PostmanCollectionFolder = config.PostmanCollectionFolder; //'./collections/';
const PostmanEnvFolder = config.PostmanEnvFolder; //'./environments/';
const PostmanDataFolder = config.PostmanDataFolder; //'./datafiles/';

// in beta
const SESSION_ON = config.session;  
const user = config.user;
const password = config.password;

const now = new Date();
// Calculate the timestamp of 7 days ago
const sevenDaysAgoTimestamp = now.getTime() - 3 * 24 * 60 * 60 * 1000;

// Express Middleware for serving static files
server.use(express.static(path.join(__dirname, "public")));
server.use(express.text({ limit: '10mb' }));

// Express routes
server.use("/dashboard", dashboardRoute);
server.use("/data", dataRoute);
server.use("/readyToDeploy", deployRoute);
// server.get("/", function (req, res) {
//   res.redirect("/dashboard");
// });

server.get("/config", function (req, res) {
  res.send(config.web);
});


server.get('/',(req, res) => {
  if (SESSION_ON){
    res.sendFile(__dirname + '/pages/login.html');
  }else{
    res.redirect('/dashboard');
  }
});

server.get("/username", (req,res)=>{
  if(req.session.loggedin){
    res.send (req.session.username);
  }else{
    res.send ("Not logged in");
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

server.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

server.get("/histresults/:ResultsEnv/:key", function (req, res) {
  let ResultsEnv = req.params.ResultsEnv;
  let myKey = req.params.key;
 fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  let data_filter = results.filter((element) => element.key == myKey);
  data_filter = data_filter.filter((element) => element.IncludeInStats == 1);
  res.send(data_filter);
});

server.get("/histresultsdays/:ResultsEnv/:key/:days", function (req, res) {
  let ResultsEnv = req.params.ResultsEnv;
  let numDays = req.params.days;
  let myKey = req.params.key;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  let data_filter = results.filter((element) => element.key == myKey);
  data_filter = data_filter.filter((element) => element.IncludeInStats == 1);
  const now = new Date();
  // Calculate the timestamp of 7 days ago
  if (numDays === "All") {
    numDays = 1000;
  }
  const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
  const graphHistory = data_filter.filter((record) => {
    const timestamp = parseIso8601Datetime(record.DateTime).getTime();
    return timestamp >= DaysAgoTimestamp;
  });
  res.send(graphHistory);
});

server.get("/histresults/:ResultsEnv/:key/:days", function (req, res) {
  let ResultsEnv = req.params.ResultsEnv;
  let myKey = req.params.key;
  let numDays = req.params.days;
  
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  let data_filter = results.filter((element) => element.key == myKey);
  data_filter = data_filter.filter((element) => element.IncludeInStats == 1);
  const now = new Date();
  // Calculate the timestamp of 7 days ago
  const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;
  const graphHistory = data_filter.filter((record) => {
    const timestamp = parseIso8601Datetime(record.DateTime).getTime();
    return timestamp >= DaysAgoTimestamp;
  });
  res.send(graphHistory);
});

function parseIso8601Datetime(isoString) {
  return new Date(isoString);
}

server.get("/histresultskeys/:ResultsEnv", function (req, res) {
  // gives a list of all keys(collection names) that are in result history log
  let ResultsEnv = req.params.ResultsEnv;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  const transactions = results.map((trans) => trans.key);
  const distinctTrans = Array.from(new Set(transactions));
  res.send(distinctTrans);
});

/// Main Dashboard calls
server.get("/results/:ResultsEnv/", function (req, res) {
  //returns the latest results json
  let ResultsEnv = req.params.ResultsEnv;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getResultFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  res.send(results);
});

server.get("/getStats/:ResultsEnv/:key", function (req, res) {
  //returns the stats for a key from history results
  // not finished
  let ResultsEnv = req.params.ResultsEnv;
  let myKey = req.params.key;
  let error = 0;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);

  if (error == 0) {
    // 29/3   refactor / check this to how file can be validated
    let results = fn.createJsonArrayFromFile(filename);
    let data = results.filter((element) => element.key == myKey);
    const green = data.reduce((accumulator, data) => {
      if (data.value === "Green") {
        accumulator++;
      }
      return accumulator;
    }, 0);
    const amber = data.reduce((accumulator, data) => {
      if (data.value === "Amber") {
        accumulator++;
      }
      return accumulator;
    }, 0);

    results = {
      Feature: myKey,
      Green: green,
      Amber: amber,
      Red: data.length - green - amber,
      Total: data.length,
    };
    res.send(results);
  } else {
    res.send("Environment does not exist");
  }
});

server.get("/getSummaryStats/:ResultsEnv", function (req, res) {
  let ResultsEnv = req.params.ResultsEnv;
  let error = 0;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);
  if (error == 0) {
    let results = fn.createJsonArrayFromFile(filename);
    const green = results.reduce((accumulator, results) => {
      if (results.value === "Green") {
        accumulator++;
      }
      return accumulator;
    }, 0);
    const amber = results.reduce((accumulator, results) => {
      if (results.value === "Amber") {
        accumulator++;
      }
      return accumulator;
    }, 0);

    EnvStats = {
      Environment: ResultsEnv,
      Green: green,
      Amber: amber,
      Red: results.length - green - amber,
      Total: results.length,
    };
    res.send(EnvStats);
  } else {
    res.send("Environment does not exist");
  }
});

server.get("/getSummaryStats/:ResultsEnv/:days", function (req, res) {
  let ResultsEnv = req.params.ResultsEnv;
  let numDays = req.params.days;
  let error = 0;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  const filename = fn.getHistFileName(ResultsEnv);

  if (error == 0) {
    let results = fn.createJsonArrayFromFile(filename);

    const now = new Date();
    // Calculate the timestamp of a time in the past
    const DaysAgoTimestamp = now.getTime() - numDays * 24 * 60 * 60 * 1000;

    const data = results.filter((record) => {
      const timestamp = parseIso8601Datetime(record.DateTime).getTime();
      return timestamp >= DaysAgoTimestamp;
    });

    const green = data.reduce((accumulator, data) => {
      if (data.value === "Green") {
        accumulator++;
      }
      return accumulator;
    }, 0);
    const amber = data.reduce((accumulator, data) => {
      if (data.value === "Amber") {
        accumulator++;
      }
      return accumulator;
    }, 0);

    EnvStats = {
      Environment: ResultsEnv,
      Green: green,
      Amber: amber,
      Red: data.length - green - amber,
      Total: data.length,
    };
    res.send(EnvStats);
  } else {
    res.send("Environment does not exist");
  }
});


server.get ('/runDev', async function (req,res){
  const result = await runTests(0, "devresults");
  fn.logOutput("Info","Result : " + result);
  res.redirect("/");
});

server.get ('/runTest',async function (req,res){
  const result = await runTests(0, "testresults");
  fn.logOutput("Info","Result : " + result);
  res.redirect("/");
});

server.get ('/runStaging', async function (req,res){
  const result = await runTests(0, "stagingresults");
  fn.logOutput("Info","Result : " + result);
  res.redirect("/");
});


//Cron and run tests  0 */15 * * * *
//everyMinute , every10Minutes , every15Minutes, 
// change frequency of executions
let job1 = new CronJob( everyMinute,function startjob1() { runTests(0, "devresults"); },null,true, "Australia/Sydney"); //end job
let job2 = new CronJob( everyMinute,function startjob1() { runTests(1, "testresults"); },null,true, "Australia/Sydney"); //end job
let job3 = new CronJob( everyMinute,function startjob1() { runTests(2, "stagingresults"); },null,true, "Australia/Sydney"); //end job

function runTests(region, filename) {
  return new Promise((resolve, reject) => {
  // Cron jobs runs the schuedules using this function
  let testdata = fs.readFileSync("./featuretests/collections.json");
  let schedule = JSON.parse(testdata);
   let totalTestsArray = Object.keys(schedule.ENV[region].tests);
   let tests = schedule.ENV[region].tests;
  // fn.logOutput("objects", totalTests1.keys());
  ///TODO get an object that filters out test collections that are not meant to be run
  // filter is working but need to focus more on this in next version to make it work.
  let totalTests = Object.keys(schedule.ENV[region].tests).length;
  let filteredTests = Object.keys(tests).filter(key => tests[key].Active == 1);
  let filteredTestCount = Object.keys(tests).filter(key => tests[key].Active == 1).length;
  fn.logOutput("Total number of test objects", totalTests);
  fn.logOutput("Total number of filtered test objects", filteredTests.length);

  for (var i = 0; i < totalTests; i++) {
    //   for (var i = 0; i < filteredTests; i++) {
    // let collection = PostmanCollectionFolder + totalTests[i].script_name ;
    // let env = totalTests[i].environment_name;
    let envfile;
    let datafile;
    let collection =
      PostmanCollectionFolder + schedule.ENV[region].tests[i].script_name;
    if (schedule.ENV[region].tests[i].environment_name != "") {
      envfile =
        PostmanEnvFolder + schedule.ENV[region].tests[i].environment_name;
    } else {
      envfile = "";
    }
    if (schedule.ENV[region].tests[i].datafile != "") {
      datafile = PostmanDataFolder + schedule.ENV[region].tests[i].datafile;
    } else {
      datafile = "";
    }
    runMyTest(collection, envfile, schedule.ENV[region], datafile, filename);
    const log = fn.myDateTime() +","+ schedule.ENV[region].tests[i].script_name +","+  schedule.ENV[region].tests[i].environment_name ;
    fn.writeToCurrentLog(JSON.stringify(log) + "\n", 'logs');
    fn.logOutput("Info","Log : " + log);
 
  }
  resolve("Tests completed successfully.");
});
}

function runMyTest(collection,environmentfile, environmentName, datafile, filename) {
  // Clear the current log to write new results.

  fn.clearCurrentLog(filename);
  // Run the collections with Newman

  const options = {
    collection: collection, // Path to the Postman Collection JSON file
    reporters: "cli", // Use the command-line reporter for generating the report
  };
  // Optional: set up the environment object if the environment file is provided
  //const environmentFile = environment; // Path to the Postman Environment JSON file (optional)
  if (environmentfile != "") {
    options.environment = environmentfile;
  }

  if (datafile != "") {
    options.iterationData = datafile;
  }

  newman.run(options, function (err, res) {
    if (err) {
      //write to error log.
     
      fn.logOutput("Info","An errof has occurred " + err);
      throw err;
    }
    res.run.executions.forEach((exec) => {
      fn.logOutput("Info","API Request call:", exec.item.name);
      // console.log('Response:', JSON.parse(exec.response.stream));
    });
    // create fail rates
    // parse collection variable to make a nice Key for chart
    let myCollectionString = collection.split("/");
    fn.logOutput("Info","mystring is:" + myCollectionString);
    let myKey = myCollectionString[2].split(".");
    let failedTestCount = res.run.stats.assertions.failed;
    let totalTestCount = res.run.stats.assertions.total;
    let FailRate = fn.calculatePercentage(
      res.run.stats.assertions.failed,
      res.run.stats.assertions.total
    );
    let status = fn.RAG(100 - FailRate);
    let statusString = status;
    let runTiming = res.run.timings.responseAverage;
    let scriptName = res.run.executions[0].item.name;
    let IncludeInStats = 1; // test results by default are included
    let RemoveComment = ""; // test result comments by default are blank

    if (statusString != "Green") {
      IncludeInStats = 0;
      RemoveComment = "Test failures have distorted timing.";
    }

    let testResult = {
      DateTime: fn.myDateTime(),
      Environment: environmentName.Name, //myEnv[0],//Environment Name comes from feature test file
      key: myKey[0],
      value: statusString,
      TestCount: totalTestCount,
      FailedTestCount: failedTestCount,
      AvgResponseTime: runTiming,
      IncludeInStats: IncludeInStats,
      RemoveComment: RemoveComment,
    };
    //add the result to the JSON array.
    fn.CreateJsonObjectForResults(testResult);
    fn.logOutput("Info","Filename is " + filename);
    fn.writeToCurrentLog(JSON.stringify(testResult) + "\n", filename);
    fn.writeHistoryLogs(JSON.stringify(testResult) + "\n", "hist_" + filename);
    fn.logOutput("Info",FailRate + " % failed");
    fn.logOutput("Info","RAG Status " + status);
    let record = JSON.stringify(statusString);

    if (ExtendedLog){
      fn.writeToCurrentLog(JSON.stringify(res.run) + "\n", '_ExtendedLog_' +filename);
    }

    
  });
} // end runMyTest

const port = process.env.PORT || 8080;
function keepAlive() {
  server.listen(port, () => {
    console.log("server is running and alive");
  });
}
module.exports = keepAlive;