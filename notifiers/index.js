/**
 * Notifier registry.
 *
 * Fires registered notifiers when a test result with value "Red" is produced.
 *
 * Configuration — add entries to `config.Notifiers` in config/config.json:
 *
 *   "Notifiers": [
 *     { "type": "slack",  "webhookEnvVar": "SLACK_WEBHOOK_URL" },
 *     { "type": "teams",  "webhookEnvVar": "TEAMS_WEBHOOK_URL" }
 *   ]
 *
 * Each notifier reads its webhook URL from the named environment variable so
 * secrets never live in config files.
 *
 * Custom notifiers can be added by calling `register(name, handler)` before
 * the server starts.  A handler must export `{ send({ webhookUrl, result }) }`.
 */

"use strict";

const builtIn = {
    slack: require("./slack"),
    teams: require("./teams"),
};

const registry = { ...builtIn };

/**
 * Register a custom notifier.
 * @param {string} type - notifier name (matches config "type" field)
 * @param {{ send: Function }} handler
 */
function register(type, handler) {
    registry[type] = handler;
}

/**
 * Fire all configured notifiers for a test result.
 * Silently no-ops when result.value is not "Red" or Notifiers is empty.
 *
 * @param {object} result         - test result from runMyTest
 * @param {Array}  notifierCfgs   - config.Notifiers array
 */
async function notify(result, notifierCfgs = []) {
    if (!result || result.value !== "Red" || !notifierCfgs.length) return;

    for (const cfg of notifierCfgs) {
        const notifier = registry[cfg.type];
        if (!notifier) {
            console.warn(`[notifiers] Unknown type "${cfg.type}" — skipping`);
            continue;
        }
        if (!cfg.webhookEnvVar) {
            console.warn(`[notifiers] "${cfg.type}" is missing webhookEnvVar — skipping`);
            continue;
        }
        const webhookUrl = process.env[cfg.webhookEnvVar];
        if (!webhookUrl) {
            console.warn(`[notifiers] "${cfg.type}": env var "${cfg.webhookEnvVar}" is not set — skipping`);
            continue;
        }
        try {
            await notifier.send({ webhookUrl, result, config: cfg });
        } catch (err) {
            console.error(`[notifiers] "${cfg.type}" failed: ${err.message}`);
        }
    }
}

module.exports = { register, notify };
