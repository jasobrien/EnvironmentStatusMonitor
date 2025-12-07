const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const { validateEnvironment } = require("../middleware/validation");

router.get("/:ResultsEnv/:key", validateEnvironment, function (req, res) {
  // Returns the latest result by key (collection name) to the user
  const { ResultsEnv, key: myKey } = req.params;
  fn.logOutput("Info", "Environment Passed was : " + ResultsEnv);
  const filename = fn.getResultFileName(ResultsEnv);
  const results = fn.createJsonArrayFromFile(filename);
  const data_filter = results
    .filter((element) => element.key == myKey)
    .filter((element) => element.IncludeInStats == 1);
  res.send(data_filter);
});

router.get("/:ResultsEnv", validateEnvironment, function (req, res) {
  // Returns the latest results json to the user
  const { ResultsEnv } = req.params;
  fn.logOutput("Info", "Environment Passed was : " + ResultsEnv);
  const filename = fn.getResultFileName(ResultsEnv);
  const results = fn.createJsonArrayFromFile(filename);
  res.send(results);
});

module.exports = router;