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

test("Smoke tests for Applications endpoints", async (t) => {
  const ip = randomIp();
  const randomEmail = `app_smoke_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
  const password = "password123";
  const name = "App Smoke User";

  // Register User 1
  const regRes1 = await hit(NEW_BASE, "POST", "/api/auth/register", {
    ip,
    body: { name, email: randomEmail, password },
  });
  assert.equal(regRes1.status, 201);
  const token1 = regRes1.json.token;

  // Register User 2
  const randomEmail2 = `app_smoke2_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
  const regRes2 = await hit(NEW_BASE, "POST", "/api/auth/register", {
    ip,
    body: { name: `${name} 2`, email: randomEmail2, password },
  });
  assert.equal(regRes2.status, 201);
  const token2 = regRes2.json.token;

  // 1. GET /api/applications with no token -> 401
  await t.test("1. GET /api/applications with no token -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/applications", { ip });
    assert.equal(res.status, 401);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld("GET", "/api/applications", {}, res);
  });

  let createdId = null;

  // 2. POST /api/applications {company, role} -> 201, and the body has an id
  await t.test("2. POST /api/applications {company, role} -> 201", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/applications", {
      ip,
      token: token1,
      body: { company: "Acme Corp", role: "Software Engineer" },
    });
    assert.equal(res.status, 201);
    assert.ok(res.json && typeof res.json.id === "string");
    createdId = res.json.id;
  });

  // 3. GET /api/applications -> 200, an array containing that id
  await t.test("3. GET /api/applications -> 200 containing that id", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/applications", {
      ip,
      token: token1,
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json));
    assert.ok(res.json.some((app) => app.id === createdId));
  });

  // 4. POST with status: "APPLIED" and no appliedAt -> 201 with a non-null appliedAt
  await t.test("4. POST with status APPLIED and no appliedAt -> 201 with non-null appliedAt", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/applications", {
      ip,
      token: token1,
      body: { company: "Beta LLC", role: "Frontend Dev", status: "APPLIED" },
    });
    assert.equal(res.status, 201);
    assert.ok(res.json && res.json.appliedAt !== null && res.json.appliedAt !== undefined);
  });

  // 5. POST with a missing company -> 400
  await t.test("5. POST with missing company -> 400", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/applications", {
      ip,
      token: token1,
      body: { role: "Backend Dev" },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 6. PATCH /api/applications/<id> {status: "INTERVIEWING"} -> 200 with the new status
  await t.test("6. PATCH /api/applications/<id> {status: INTERVIEWING} -> 200", async () => {
    const res = await hit(NEW_BASE, "PATCH", `/api/applications/${createdId}`, {
      ip,
      token: token1,
      body: { status: "INTERVIEWING" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.json?.status, "INTERVIEWING");
  });

  // 7. PATCH a non-existent id -> 404
  await t.test("7. PATCH non-existent id -> 404", async () => {
    const res = await hit(NEW_BASE, "PATCH", "/api/applications/non-existent-id-12345", {
      ip,
      token: token1,
      body: { status: "INTERVIEWING" },
    });
    assert.equal(res.status, 404);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 8. DELETE /api/applications/<id> -> 204 and an empty body
  await t.test("8. DELETE /api/applications/<id> -> 204 empty body", async () => {
    const res = await hit(NEW_BASE, "DELETE", `/api/applications/${createdId}`, {
      ip,
      token: token1,
    });
    assert.equal(res.status, 204);
    assert.equal(res.json, null);
  });

  // 9. DELETE the same id again -> 404
  await t.test("9. DELETE same id again -> 404", async () => {
    const res = await hit(NEW_BASE, "DELETE", `/api/applications/${createdId}`, {
      ip,
      token: token1,
    });
    assert.equal(res.status, 404);
    assert.deepEqual(shapeOf(res.json), ["error"]);
  });

  // 10. a second user's token cannot PATCH or DELETE the first user's application -> 404 both times
  await t.test("10. Second user token cannot PATCH or DELETE first user's application -> 404 both times", async () => {
    const createRes = await hit(NEW_BASE, "POST", "/api/applications", {
      ip,
      token: token1,
      body: { company: "Gamma Inc", role: "DevOps Engineer" },
    });
    assert.equal(createRes.status, 201);
    const app1Id = createRes.json.id;

    const patchRes = await hit(NEW_BASE, "PATCH", `/api/applications/${app1Id}`, {
      ip,
      token: token2,
      body: { status: "OFFERED" },
    });
    assert.equal(patchRes.status, 404);

    const deleteRes = await hit(NEW_BASE, "DELETE", `/api/applications/${app1Id}`, {
      ip,
      token: token2,
    });
    assert.equal(deleteRes.status, 404);
  });
});
