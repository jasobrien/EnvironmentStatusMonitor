const express = require("express");
const router = express.Router();
const path = require("path"); // used for path
const fs = require("fs");
const fn = require("../functions");
const myPath = path.join(__dirname, "..");
router.get("/schedule", function (req, res) {
  res.sendFile(myPath + "/pages/schedule.html");
});



router.get("/scheduledata", function (req, res) {
  // Refactor to be active file
  const rawdata = fs.readFileSync("./featuretests/collections.json");
  const schedule = JSON.parse(rawdata);
  res.send(JSON.stringify(schedule));
});

router.get("/header", function (req, res) {
  // Refactor to be active file
  res.sendFile(myPath + "/pages/header.html");
});


router.get("/directory", (req, res) => {
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

router.get("/edit", function (req, res) {
  res.sendFile(myPath + "/pages/featuretests.html");
});

router.get("/editfile", (req, res) => {
  const rawdata = fs.readFileSync("./featuretests/collections.json");
  const schedule = JSON.parse(rawdata);
  res.send(JSON.stringify(schedule));
});

router.put("/editfile", (req, res) => {
  const data = JSON.stringify(req.body);
  fs.writeFile('./featuretests/collections.json', data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
    res.send('Data written to file');
  });

});


// Edit history files
// Dev
router.get("/devresults", function (req, res) {
  res.sendFile(myPath + "/pages/devresults.html");
});

router.get("/editfile/devresults", (req, res) => {
  const rawdata = fs.readFileSync("./results/hist_devresults.json");
  res.send(rawdata);
});

router.put("/editfile/devresults", (req, res) => {
  const data = req.body;
  fs.writeFile('./results/hist_devresults.json', data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
    res.send('Data written to file');
  });
});

// Test

router.get("/testresults", function (req, res) {
  res.sendFile(myPath + "/pages/testresults.html");
});

router.get("/editfile/testresults", (req, res) => {
  const rawdata = fs.readFileSync("./results/hist_testresults.json");
  res.send(rawdata);
});

router.put("/editfile/testresults", (req, res) => {
  const data = req.body;
  fs.writeFile('./results/hist_testresults.json', data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
    res.send('Data written to file');
  });
});

// Staging

router.get("/stagingresults", function (req, res) {
  res.sendFile(myPath + "/pages/stagingresults.html");
});

router.get("/editfile/stagingresults", (req, res) => {
  const rawdata = fs.readFileSync("./results/hist_stagingresults.json");
  res.send(rawdata);
});

router.put("/editfile/stagingresults", (req, res) => {
  const data = req.body;
  fs.writeFile('./results/hist_stagingresults.json', data, (err) => {
    if (err) throw err;
    console.log('Data written to file');
    res.send('Data written to file');
  });
});

// router.get("/viewdata", function (req, res) {
//   res.sendFile(myPath + "/pages/viewData.html");
// });

// router.get("/editdata", function (req, res) {
//   res.sendFile(myPath + "/pages/updatedata.html");
// });

module.exports = router;