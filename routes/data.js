const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const { requireAuth } = require("../middleware/auth");
const myPath = path.join(__dirname, "..");
const config = cf.config;
const { ResultsFolder, HistoryFilePrefix, ResultFileSuffix, FeatureTestsFolder, ScriptFolder } = config;

router.get("/schedule", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/schedule.html");
});

router.get("/scheduledata", requireAuth, function (req, res) {
  const rawdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
  const schedule = JSON.parse(rawdata);
  res.json(schedule);
});

router.get("/header", function (req, res) {
  res.sendFile(myPath + "/pages/header.html");
});


router.get("/directory", requireAuth, (req, res) => {
  const directoryPath = path.resolve(ScriptFolder);
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      fn.logOutput("Error", err);
      return res.status(500).json({
        error: "Failed to read directory"
      });
    }
    const fileDetails = files.map((fileName) => {
      const filePath = path.join(directoryPath, fileName);
      const stats = fs.statSync(filePath);
      return {
        name: fileName,
      };
    });
    res.json(fileDetails);
  });
});

router.get("/edit", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/schedules.html");
});

router.get("/editfile", requireAuth, (req, res) => {
  const rawdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
  const schedule = JSON.parse(rawdata);
  res.send(JSON.stringify(schedule));
});

router.put("/editfile", requireAuth, (req, res) => {
  const data = JSON.stringify(req.body);
  fs.writeFile(`${FeatureTestsFolder}collections.json`, data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
    res.send('Data written to file');
  });

});


// Edit history files - Dynamic routes based on environment configuration
// GET /data/{env}results            → serve results-editor.html
// GET /data/editfile/{env}results?runner=newman  → read hist_{env}_newman.json
// PUT /data/editfile/{env}results?runner=newman  → write hist_{env}_newman.json
config.environments.forEach(env => {
  router.get(`/${env.id}results`, requireAuth, function (req, res) {
    res.sendFile(myPath + `/pages/results-editor.html`);
  });

  router.get(`/editfile/${env.id}results`, requireAuth, (req, res) => {
    const { runner } = req.query;
    if (!runner) {
      return res.status(400).send('runner query parameter required (e.g. ?runner=newman)');
    }
    const filename = `${HistoryFilePrefix}${env.id}_${runner}.json`;
    try {
      const rawdata = fs.readFileSync(`${ResultsFolder}${filename}`);
      res.send(rawdata);
    } catch (error) {
      res.status(404).send(`No history file found for ${env.id}/${runner}`);
    }
  });

  router.put(`/editfile/${env.id}results`, requireAuth, (req, res) => {
    const { runner } = req.query;
    if (!runner) {
      return res.status(400).send('runner query parameter required (e.g. ?runner=newman)');
    }
    const filename = `${HistoryFilePrefix}${env.id}_${runner}.json`;
    const data = req.body;
    fs.writeFile(`${ResultsFolder}${filename}`, data, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send('Error writing file');
      }
      console.log('Data written to file');
      res.send('Data written to file');
    });
  });
});

// router.get("/viewdata", function (req, res) {
//   res.sendFile(myPath + "/pages/viewData.html");
// });

// router.get("/editdata", function (req, res) {
//   res.sendFile(myPath + "/pages/updatedata.html");
// });

module.exports = router;