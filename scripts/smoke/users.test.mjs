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

test("Smoke tests for Users and Insights endpoints", async (t) => {
  const ip = randomIp();
  const randomEmail = `user_smoke_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
  const password = "password123";
  const name = "User Smoke User";

  // Register User
  const regRes = await hit(NEW_BASE, "POST", "/api/auth/register", {
    ip,
    body: { name, email: randomEmail, password },
  });
  assert.equal(regRes.status, 201);
  const token = regRes.json.token;

  // 1. GET /api/users/profile with no token -> 401
  await t.test("1. GET /api/users/profile with no token -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/users/profile", { ip });
    assert.equal(res.status, 401);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld("GET", "/api/users/profile", {}, res);
  });

  // 2. GET /api/users/profile -> 200, containing tokenLimit, scrapeLimit, nextQuotaReset
  await t.test("2. GET /api/users/profile -> 200 containing quota fields", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/users/profile", {
      ip,
      token,
    });
    assert.equal(res.status, 200);
    assert.ok(res.json && typeof res.json === "object");
    assert.ok("tokenLimit" in res.json);
    assert.ok("scrapeLimit" in res.json);
    assert.ok("nextQuotaReset" in res.json);
  });

  // 3. PUT /api/users/profile {name: "Renamed"} -> 200 with the new name
  await t.test("3. PUT /api/users/profile {name: Renamed} -> 200", async () => {
    const res = await hit(NEW_BASE, "PUT", "/api/users/profile", {
      ip,
      token,
      body: { name: "Renamed" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.json?.name, "Renamed");
  });

  // 4. PUT with {name: ""} -> 400
  await t.test("4. PUT with {name: ''} -> 400", async () => {
    const res = await hit(NEW_BASE, "PUT", "/api/users/profile", {
      ip,
      token,
      body: { name: "" },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 5. POST /api/users/line-code -> 200 with a 6-digit code
  await t.test("5. POST /api/users/line-code -> 200 with 6-digit code", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/users/line-code", {
      ip,
      token,
    });
    assert.equal(res.status, 200);
    assert.ok(res.json && typeof res.json.code === "string");
    assert.match(res.json.code, /^\d{6}$/);
  });

  // 6. DELETE /api/users/line-link -> 200 {ok: true}
  await t.test("6. DELETE /api/users/line-link -> 200 {ok: true}", async () => {
    const res = await hit(NEW_BASE, "DELETE", "/api/users/line-link", {
      ip,
      token,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  // 7. GET /api/users/profile/export -> 200, containing applications, and not containing password
  await t.test("7. GET /api/users/profile/export -> 200 containing applications and no password", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/users/profile/export", {
      ip,
      token,
    });
    assert.equal(res.status, 200);
    assert.ok(res.json && typeof res.json === "object");
    assert.ok(Array.isArray(res.json.applications));
    assert.equal(res.json.password, undefined);
  });

  // 8. GET /api/insights/trending -> 200 with an array
  await t.test("8. GET /api/insights/trending -> 200 with an array", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/insights/trending", {
      ip,
      token,
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json));
  });

  // Throwaway user test for DELETE /api/users/profile/me
  await t.test("9. DELETE /api/users/profile/me against throwaway user -> 200", async () => {
    const throwawayEmail = `throwaway_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
    const regThrowaway = await hit(NEW_BASE, "POST", "/api/auth/register", {
      ip,
      body: { name: "Throwaway User", email: throwawayEmail, password },
    });
    assert.equal(regThrowaway.status, 201);
    const throwawayToken = regThrowaway.json.token;

    const delRes = await hit(NEW_BASE, "DELETE", "/api/users/profile/me", {
      ip,
      token: throwawayToken,
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.json?.ok, true);
  });
});
