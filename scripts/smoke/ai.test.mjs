import test from "node:test";
import assert from "node:assert/strict";
import { hit, shapeOf, randomIp } from "./runner.mjs";

const NEW_BASE = process.env.NEW_BASE || "http://localhost:3000";
const OLD_BASE = process.env.OLD_BASE;

async function checkOld(method, path, options, newResult) {
  if (!OLD_BASE) return;
  const oldResult = await hit(OLD_BASE, method, path, options);
  assert.equal(
    newResult.status,
    oldResult.status,
    `Status mismatch between NEW and OLD for ${method} ${path}`
  );
  assert.deepEqual(
    shapeOf(newResult.json),
    shapeOf(oldResult.json),
    `Shape mismatch between NEW and OLD for ${method} ${path}`
  );
}

const AI_ENDPOINTS = [
  "/api/ai/parse-jd",
  "/api/ai/tailor",
  "/api/ai/interview",
  "/api/ai/email",
  "/api/ai/score-resume",
  "/api/ai/optimize-resume",
  "/api/ai/scrape-url",
  "/api/ai/compare-jobs",
];

test("Smoke tests for AI endpoints", async (t) => {
  const ip = randomIp();
  const randomEmail = `ai_smoke_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
  const password = "password123";
  const name = "AI Smoke User";

  // Register User
  const regRes = await hit(NEW_BASE, "POST", "/api/auth/register", {
    ip,
    body: { name, email: randomEmail, password },
  });
  assert.equal(regRes.status, 201);
  const token = regRes.json.token;

  // 1. Each of the eight endpoints with no Authorization header -> 401
  await t.test("1. Each of the eight endpoints with no Authorization header -> 401", async () => {
    for (const path of AI_ENDPOINTS) {
      const res = await hit(NEW_BASE, "POST", path, { ip });
      assert.equal(res.status, 401, `Expected 401 for ${path} without token`);
      assert.deepEqual(shapeOf(res.json), ["error"]);
      await checkOld("POST", path, {}, res);
    }
  });

  // 2. Each of the eight with an empty body {} -> 400
  await t.test("2. Each of the eight endpoints with empty body {} -> 400", async () => {
    for (const path of AI_ENDPOINTS) {
      const res = await hit(NEW_BASE, "POST", path, {
        ip,
        token,
        body: {},
      });
      assert.equal(res.status, 400, `Expected 400 for ${path} with empty body`);
      assert.deepEqual(shapeOf(res.json), ["error"]);
    }
  });

  // 3. /compare-jobs with one jobId -> 400
  await t.test("3. /api/ai/compare-jobs with one jobId -> 400", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/ai/compare-jobs", {
      ip,
      token,
      body: { jobIds: ["job-1"] },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 4. /compare-jobs with four jobIds -> 400
  await t.test("4. /api/ai/compare-jobs with four jobIds -> 400", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/ai/compare-jobs", {
      ip,
      token,
      body: { jobIds: ["job-1", "job-2", "job-3", "job-4"] },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 5. /scrape-url with {"url": "not-a-url"} -> 400
  await t.test("5. /api/ai/scrape-url with invalid URL -> 400", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/ai/scrape-url", {
      ip,
      token,
      body: { url: "not-a-url" },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 6. /tailor with a well-formed but non-existent jobId -> 404
  await t.test("6. /api/ai/tailor with non-existent jobId -> 404", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/ai/tailor", {
      ip,
      token,
      body: { jobId: "non-existent-job-id-12345" },
    });
    assert.equal(res.status, 404);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });
});
