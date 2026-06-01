/**
 * Microsoft Teams notifier — sends an Adaptive Card to a Teams Incoming Webhook.
 *
 * Compatible with the "Workflows" Power Automate connector (the modern replacement
 * for the legacy O365 Connector).
 *
 * Required env var: the value of `webhookEnvVar` in your notifier config entry.
 * Get the URL from: Teams channel → Connectors → Incoming Webhook (legacy) or
 * Power Automate → "Post to a channel when a webhook request is received".
 */

"use strict";

const https = require("https");
const { URL } = require("url");

module.exports = {
    async send({ webhookUrl, result }) {
        const statusIcon = result.value === "Red" ? "🔴" : "🟡";
        const payload = JSON.stringify({
            type: "message",
            attachments: [
                {
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: {
                        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                        type: "AdaptiveCard",
                        version: "1.3",
                        body: [
                            {
                                type: "TextBlock",
                                text: `${statusIcon} **${result.key}** is **${result.value}** in **${result.Environment}**`,
                                weight: "Bolder",
                                wrap: true,
                            },
                            {
                                type: "TextBlock",
                                text: `Runner: ${result.runner} | Failed: ${result.FailedTestCount}/${result.TestCount}`,
                                wrap: true,
                            },
                        ],
                    },
                },
            ],
        });
        return post(webhookUrl, payload, "Teams");
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
