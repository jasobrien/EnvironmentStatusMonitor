const express = require("express");
const router = express.Router();
const path = require("path");
const myPath = path.join(__dirname, "..");
const { requireAuth } = require("../middleware/auth");

// All routes use authentication middleware
router.get("/", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/dashboard.html");
});

router.get("/performance/:env/", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/performance.html");
});

router.get("/performance/:env/:days", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/performance.html");
});

router.get("/config", requireAuth, function (req, res) {
  res.sendFile(myPath + "/pages/config.html");
});

module.exports = router;