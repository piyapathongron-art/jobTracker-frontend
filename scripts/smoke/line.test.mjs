import test from "node:test";
import assert from "node:assert/strict";
import { hit, shapeOf, randomIp } from "./runner.mjs";

const NEW_BASE = process.env.NEW_BASE || "http://localhost:3000";

test("Smoke tests for LINE webhook and Cron reminders endpoints", async (t) => {
  const ip = randomIp();

  // 1. POST /api/line/webhook with no x-line-signature -> 401
  await t.test("1. POST /api/line/webhook with no x-line-signature -> 401", async () => {
    const res = await fetch(`${NEW_BASE.replace(/\/$/, "")}/api/line/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ events: [] }),
    });
    let json;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    assert.equal(res.status, 401, "Expected 401 for webhook without x-line-signature");
    assert.deepEqual(shapeOf(json), ["error"]);
  });

  // 2. POST /api/line/webhook with a wrong signature -> 401
  await t.test("2. POST /api/line/webhook with a wrong signature -> 401", async () => {
    const res = await fetch(`${NEW_BASE.replace(/\/$/, "")}/api/line/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": "invalid_signature_string",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ events: [] }),
    });
    let json;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    assert.equal(res.status, 401, "Expected 401 for webhook with invalid signature");
    assert.deepEqual(shapeOf(json), ["error"]);
  });

  // 3. GET /api/cron/reminders with no Authorization header -> 401
  await t.test("3. GET /api/cron/reminders with no Authorization header -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/cron/reminders", { ip });
    assert.equal(res.status, 401, "Expected 401 for cron without authorization header");
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 4. GET /api/cron/reminders with a wrong bearer token -> 401
  await t.test("4. GET /api/cron/reminders with a wrong bearer token -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/cron/reminders", {
      ip,
      token: "definitely_wrong_cron_token_12345",
    });
    assert.equal(res.status, 401, "Expected 401 for cron with wrong bearer token");
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });
});
