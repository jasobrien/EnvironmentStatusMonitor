const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const { requireAuth } = require("../middleware/auth");
const myPath = path.join(__dirname, "..");
const config = cf.config;
const { ResultsFolder, HistoryFilePrefix, ResultFileSuffix, FeatureTestsFolder } = config;

router.get("/schedule", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/schedule.html");
});

router.get("/scheduledata", requireAuth, function (req, res) {
  const rawdata = fs.readFileSync(`${FeatureTestsFolder}collections.json`);
  const schedule = JSON.parse(rawdata);
  res.send(JSON.stringify(schedule));
});

router.get("/header", function (req, res) {
  res.sendFile(myPath + "/pages/header.html");
});


router.get("/directory", requireAuth, (req, res) => {
  const directoryPath = myPath + "/collections"; // replace with your directory path
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
  res.sendFile(myPath + "/pages/featuretests.html");
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
config.environments.forEach(env => {
  router.get(`/${env.id}results`, function (req, res) {
    res.sendFile(myPath + `/pages/${env.id}results.html`);
  });

  router.get(`/editfile/${env.id}results`, (req, res) => {
    const filename = `${HistoryFilePrefix}${env.id}${ResultFileSuffix}`;
    try {
      const rawdata = fs.readFileSync(`${ResultsFolder}${filename}.json`);
      res.send(rawdata);
    } catch (error) {
      res.status(404).send(`File not found for ${env.id} environment`);
    }
  });

  router.put(`/editfile/${env.id}results`, (req, res) => {
    const data = req.body;
    const filename = `${HistoryFilePrefix}${env.id}${ResultFileSuffix}`;
    fs.writeFile(`${ResultsFolder}${filename}.json`, data, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        res.status(500).send('Error writing file');
        return;
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