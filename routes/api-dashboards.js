"use strict";

/**
 * Saved-dashboard CRUD API.
 *
 *   GET    /api/dashboards          — list all saved dashboards
 *   GET    /api/dashboards/:id      — get one dashboard
 *   POST   /api/dashboards          — create dashboard (auth required)
 *   PUT    /api/dashboards/:id      — update dashboard (auth required)
 *   DELETE /api/dashboards/:id      — delete dashboard (auth required, non-default only)
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const fn = require("../functions");
const { requireAuth } = require("../middleware/auth");

const DASHBOARDS_PATH = path.join(__dirname, "..", "config", "dashboards.json");

function readDashboards() {
    try {
        return JSON.parse(fs.readFileSync(DASHBOARDS_PATH, "utf8"));
    } catch {
        return [];
    }
}

function writeDashboards(data) {
    fs.writeFileSync(DASHBOARDS_PATH, JSON.stringify(data, null, 2), "utf8");
}

router.get("/api/dashboards", (req, res) => {
    res.json(readDashboards());
});

router.get("/api/dashboards/:id", (req, res) => {
    const dashboards = readDashboards();
    const board = dashboards.find(d => d.id === req.params.id);
    if (!board) return res.status(404).json({ error: "Not found" });
    res.json(board);
});

router.post("/api/dashboards", requireAuth, (req, res) => {
    const dashboards = readDashboards();
    const newBoard = {
        id: Date.now().toString(),
        ...req.body,
        isDefault: false,
    };
    dashboards.push(newBoard);
    writeDashboards(dashboards);
    fn.logOutput("Info", `Dashboard created: ${newBoard.id}`);
    res.status(201).json(newBoard);
});

router.put("/api/dashboards/:id", requireAuth, (req, res) => {
    const dashboards = readDashboards();
    const idx = dashboards.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    dashboards[idx] = { ...dashboards[idx], ...req.body, id: req.params.id };
    writeDashboards(dashboards);
    fn.logOutput("Info", `Dashboard updated: ${req.params.id}`);
    res.json(dashboards[idx]);
});

router.delete("/api/dashboards/:id", requireAuth, (req, res) => {
    const dashboards = readDashboards();
    const board = dashboards.find(d => d.id === req.params.id);
    if (!board) return res.status(404).json({ error: "Not found" });
    if (board.isDefault) return res.status(403).json({ error: "Cannot delete a default dashboard" });
    const updated = dashboards.filter(d => d.id !== req.params.id);
    writeDashboards(updated);
    fn.logOutput("Info", `Dashboard deleted: ${req.params.id}`);
    res.json({ status: "deleted" });
});

module.exports = router;
