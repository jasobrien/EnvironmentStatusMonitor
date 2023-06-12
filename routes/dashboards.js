const express = require("express");
const router = express.Router();
let path = require("path"); // used for path
const myPath = path.join(__dirname, "..");
let cf = require("../config/config.js");

let config = cf.config;
const SESSION_ON = config.session;


router.get("/", function (req, res) {
  if(SESSION_ON){
    if(req.session.loggedin || !SESSION_ON){
      res.sendFile(myPath + "/pages/dashboard.html");
      }else{
        res.redirect('/');
       // res.send("User not logged in");
      }
  }else{
    res.sendFile(myPath + "/pages/dashboard.html");
  }
 
});

router.get("/performance/:env/", function (req, res) {
    if(req.session.loggedin || !SESSION_ON){
  res.sendFile(myPath + "/pages/performance.html");
  }else{
    res.redirect('/');
    //res.send("User not logged in");
  }

});

router.get("/performance/:env/:days", function (req, res) {

    if(req.session.loggedin || !SESSION_ON){
  res.sendFile(myPath + "/pages/performance.html");
  }else{
    res.redirect('/');
    //res.send("User not logged in");
  }

});

module.exports = router;
