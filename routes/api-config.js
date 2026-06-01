"use strict";

/**
 * App-config API routes.
 *
 *   GET  /config       — public config for the frontend (no credentials)
 *   GET  /api/config   — full config (auth required when session is on)
 *   POST /api/config   — update config.json at runtime (auth required)
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const fn = require("../functions");
const { requireAuth } = require("../middleware/auth");
const cfgModule = require("../config/config");

const CONFIG_JSON_PATH = path.join(__dirname, "..", "config", "config.json");

// Fields that must never be written via the API
const PROTECTED_KEYS = ["user", "password", "session"];

function getPublicConfig() {
    const cfg = cfgModule.config;
    return {
        environments: cfg.environments || [],
        DefaultRunner: cfg.DefaultRunner,
        Green: cfg.Green,
        Amber: cfg.Amber,
    };
}

// Public config (frontend)
router.get("/config", (req, res) => {
    res.json(getPublicConfig());
});

// Full config (authenticated)
router.get("/api/config", requireAuth, (req, res) => {
    res.json(cfgModule.config);
});

// Write config.json (authenticated)
router.post("/api/config", requireAuth, (req, res) => {
    fn.logOutput("Info", "Config update requested");
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
        return res.status(400).json({ error: "Invalid config body" });
    }
    const updated = { ...cfgModule.config };
    for (const [key, value] of Object.entries(incoming)) {
        if (!PROTECTED_KEYS.includes(key)) {
            updated[key] = value;
        }
    }
    try {
        fs.writeFileSync(CONFIG_JSON_PATH, JSON.stringify(updated, null, 2), "utf8");
        // Reload the in-memory config reference
        delete require.cache[require.resolve("../config/config.json")];
        cfgModule.config = require("../config/config.json");
        fn.logOutput("Info", "config.json updated");
        res.json({ status: "ok" });
    } catch (e) {
        fn.logOutput("Error", `Failed to write config.json: ${e.message}`);
        res.status(500).json({ error: "Failed to save configuration" });
    }
});

module.exports = router;
