/**
 * Slack notifier — sends a message to a Slack Incoming Webhook.
 *
 * Required env var: the value of `webhookEnvVar` in your notifier config entry.
 * Get the URL from: Slack → Manage Apps → Incoming Webhooks.
 */

"use strict";

const https = require("https");
const { URL } = require("url");

module.exports = {
    async send({ webhookUrl, result }) {
        const icon = result.value === "Red" ? ":red_circle:" : ":large_yellow_circle:";
        const text =
            `${icon} *${result.key}* is *${result.value}* in *${result.Environment}*\n` +
            `Runner: \`${result.runner}\` | Failed: ${result.FailedTestCount}/${result.TestCount}`;

        const payload = JSON.stringify({ text });
        return post(webhookUrl, payload, "Slack");
    },
};

function post(webhookUrl, payload, label) {
    const url = new URL(webhookUrl);
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                },
            },
            (res) => {
                let body = "";
                res.on("data", (d) => (body += d));
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        reject(new Error(`${label} webhook returned HTTP ${res.statusCode}: ${body}`));
                    }
                });
            }
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

module.exports._post = post; // exported for testing
