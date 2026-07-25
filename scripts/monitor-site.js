#!/usr/bin/env node
/**
 * Production frontend uptime monitor.
 *
 * Fetches the deployed production URL and asserts a 200 response over TLS
 * (and, optionally, that the body contains an expected marker string), then
 * exits non-zero on any failure so a scheduler (GitHub Actions) can react.
 * On failure, webhook alerts are dispatched to any configured channels
 * (Slack, Discord). Deduplication is handled at the workflow layer
 * (uptime.yml opens/closes a GitHub issue), so this script always fires on
 * failure — it does NOT suppress repeated alerts internally.
 *
 * Environment variables:
 *   PRODUCTION_URL         URL to monitor (required)
 *   EXPECTED_CONTENT       Substring expected in the response body (optional)
 *   SITE_TIMEOUT_MS        Per-request timeout in ms (default: 10000)
 *   SLACK_WEBHOOK_URL      Slack incoming-webhook URL  (optional)
 *   DISCORD_WEBHOOK_URL    Discord incoming-webhook URL (optional)
 *
 * Exit codes:
 *   0  Site is healthy
 *   1  Site is unreachable or failed assertions
 *
 * Usage:
 *   node scripts/monitor-site.js
 */

"use strict";

const PRODUCTION_URL = process.env.PRODUCTION_URL || "";
const EXPECTED_CONTENT = process.env.EXPECTED_CONTENT || "";
const TIMEOUT_MS = Number(process.env.SITE_TIMEOUT_MS || 10_000);
const SLACK_WEBHOOK_URL   = process.env.SLACK_WEBHOOK_URL   || "";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

// ── Webhook helpers ────────────────────────────────────────────────────────────

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
}

async function alertSlack(text) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await postJson(SLACK_WEBHOOK_URL, { text });
    console.error("  → Slack alert sent");
  } catch (err) {
    console.error(`  → Failed to post Slack alert: ${err.message}`);
  }
}

async function alertDiscord(content) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    // Discord expects { content } for a plain message
    await postJson(DISCORD_WEBHOOK_URL, { content });
    console.error("  → Discord alert sent");
  } catch (err) {
    console.error(`  → Failed to post Discord alert: ${err.message}`);
  }
}

async function dispatchAlerts(message) {
  await Promise.all([alertSlack(message), alertDiscord(message)]);
}

// ── Health check ───────────────────────────────────────────────────────────────

async function checkSite() {
  if (!PRODUCTION_URL) {
    console.error("❌ PRODUCTION_URL is not set — cannot run uptime check.");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(PRODUCTION_URL, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const latency = Date.now() - start;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (!res.url.startsWith("https://")) {
      throw new Error(`response URL is not https (${res.url}) — TLS not in effect`);
    }

    if (EXPECTED_CONTENT) {
      const body = await res.text();
      if (!body.includes(EXPECTED_CONTENT)) {
        throw new Error(`response body missing expected content: "${EXPECTED_CONTENT}"`);
      }
    }

    console.log(`✅ Site healthy — ${PRODUCTION_URL} (${latency}ms)`);
    return true;
  } catch (err) {
    const reason =
      err.name === "AbortError"
        ? `timeout after ${TIMEOUT_MS}ms`
        : err.message;
    const msg = `❌ Site unhealthy — ${PRODUCTION_URL}: ${reason}`;
    console.error(msg);
    await dispatchAlerts(msg);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

checkSite().then((healthy) => process.exit(healthy ? 0 : 1));
