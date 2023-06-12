const express = require("express");
const router = express.Router();
let path = require("path"); // used for path
const fs = require("fs");
let fn = require("../functions");
let cf = require("../config/config");

router.get("/:ResultsEnv/:key", function (req, res) {
  //returns the latest result by key(collection name) to the user
  //TODO - catch if it doesnt exist
  let ResultsEnv = req.params.ResultsEnv;
  let myKey = req.params.key;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  let filename = fn.getResultFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  let data_filter = results.filter((element) => element.key == myKey);
  data_filter = data_filter.filter((element) => element.IncludeInStats == 1);
  //console.log(data_filter)
  res.send(data_filter);
});

router.get("/:ResultsEnv", function (req, res) {
  //returns the latest results json to the user
  let ResultsEnv = req.params.ResultsEnv;
  fn.logOutput("Info","Environment Passed was : " + ResultsEnv);
  let filename = fn.getResultFileName(ResultsEnv);
  let results = fn.createJsonArrayFromFile(filename);
  res.send(results);
});
module.exports = router;
