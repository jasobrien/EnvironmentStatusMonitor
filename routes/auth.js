"use strict";

/**
 * Auth routes: login, logout, session check, username.
 * Credentials are read from ADMIN_USER / ADMIN_PASSWORD env vars at module
 * load time so the fail-fast check happens during server startup.
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const config = require("../config/config").config;

const SESSION_ON = config.session;
const pagesPath = path.join(__dirname, "..", "pages");

let ADMIN_USER;
let _adminPasswordHash;

if (SESSION_ON) {
    ADMIN_USER = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!ADMIN_USER || !adminPassword) {
        throw new Error("ADMIN_USER and ADMIN_PASSWORD environment variables must be set when session is enabled");
    }
    _adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts, please try again later",
});

// Root redirect: show login page when session is on, else go to dashboard
router.get("/", (req, res) => {
    if (SESSION_ON) {
        res.sendFile(path.join(pagesPath, "login.html"));
    } else {
        res.redirect("/dashboard");
    }
});

router.get("/username", (req, res) => {
    if (req.session && req.session.loggedin) {
        res.send(req.session.username);
    } else {
        res.send("Not logged in");
    }
});

router.post("/login", loginLimiter, (req, res) => {
    const { username, password } = req.body;
    if (SESSION_ON && username === ADMIN_USER && bcrypt.compareSync(password, _adminPasswordHash)) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect("/dashboard");
    } else {
        res.send("Invalid username or password");
    }
});

router.get("/check-login", (req, res) => {
    if (SESSION_ON) {
        res.json({ loggedin: (req.session && req.session.loggedin) || false });
    } else {
        res.json({ loggedin: false });
    }
});

router.get("/logout", (req, res) => {
    if (req.session) req.session.destroy();
    res.redirect("/");
});

module.exports = router;
