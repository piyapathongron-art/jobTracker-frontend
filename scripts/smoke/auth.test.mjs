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

test("Smoke tests for Auth endpoints", async (t) => {
  const randomEmail = `smoke_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
  const password = "password123";
  const ip = randomIp();
  const name = "Smoke Test User";

  // 1. register with a fresh random email -> 201, body shape {token, user{id,name,email,hasResume}}
  await t.test("1. Register fresh random email", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/auth/register", {
      ip,
      body: { name, email: randomEmail, password },
    });
    assert.equal(res.status, 201);
    assert.deepEqual(shapeOf(res.json), [
      "token",
      "user.email",
      "user.hasResume",
      "user.id",
      "user.name",
    ]);
    await checkOld(
      "POST",
      "/api/auth/register",
      { body: { name, email: `old_${randomEmail}`, password } },
      res
    );
  });

  // 2. register with that same email again -> 409
  await t.test("2. Register duplicate email -> 409", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/auth/register", {
      ip,
      body: { name, email: randomEmail, password },
    });
    assert.equal(res.status, 409);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld(
      "POST",
      "/api/auth/register",
      { body: { name, email: `old_${randomEmail}`, password } },
      res
    );
  });

  // 3. register with a 7-character password -> 400
  await t.test("3. Register short password -> 400", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/auth/register", {
      ip,
      body: { name, email: `short_${randomEmail}`, password: "short17" },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld(
      "POST",
      "/api/auth/register",
      { body: { name, email: `short_old_${randomEmail}`, password: "short17" } },
      res
    );
  });

  // 4. login with wrong password -> 401
  await t.test("4. Login wrong password -> 401", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/auth/login", {
      ip,
      body: { email: randomEmail, password: "wrongpassword" },
    });
    assert.equal(res.status, 401);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld(
      "POST",
      "/api/auth/login",
      { body: { email: `old_${randomEmail}`, password: "wrongpassword" } },
      res
    );
  });

  // 5. login correctly -> 200, same body shape as case 1
  await t.test("5. Login correctly -> 200", async () => {
    const res = await hit(NEW_BASE, "POST", "/api/auth/login", {
      ip,
      body: { email: randomEmail, password },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(shapeOf(res.json), [
      "token",
      "user.email",
      "user.hasResume",
      "user.id",
      "user.name",
    ]);
    await checkOld(
      "POST",
      "/api/auth/login",
      { body: { email: `old_${randomEmail}`, password } },
      res
    );
  });

  // 6. any authenticated route with no Authorization header -> 401
  await t.test("6. Authenticated route missing Authorization header -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/users/profile", { ip });
    assert.equal(res.status, 401);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld("GET", "/api/users/profile", {}, res);
  });

  // 7. same with a garbage token -> 401
  await t.test("7. Authenticated route garbage token -> 401", async () => {
    const res = await hit(NEW_BASE, "GET", "/api/users/profile", {
      ip,
      token: "invalid.garbage.token",
    });
    assert.equal(res.status, 401);
    assert.deepEqual(shapeOf(res.json), ["error"]);
    await checkOld("GET", "/api/users/profile", { token: "invalid.garbage.token" }, res);
  });

  // 8. 11 consecutive failed logins for one email -> the 11th returns 429
  await t.test("8. Rate limit 11 consecutive failed logins -> 429 on 11th", async () => {
    const rateLimitEmail = `rate_${Date.now()}_${Math.random().toString(36).substring(2)}@example.com`;
    for (let i = 1; i <= 10; i++) {
      const r = await hit(NEW_BASE, "POST", "/api/auth/login", {
        ip,
        body: { email: rateLimitEmail, password: "wrongpassword" },
      });
      assert.equal(r.status, 401, `Expected 401 on attempt ${i}`);
    }
    const r11 = await hit(NEW_BASE, "POST", "/api/auth/login", {
      ip,
      body: { email: rateLimitEmail, password: "wrongpassword" },
    });
    assert.equal(r11.status, 429, "Expected 429 on 11th attempt");
    assert.deepEqual(shapeOf(r11.json), ["error"]);
  });

  // 9. one IP spraying distinct accounts gets cut off, even though no single account ever reached
  //    the per-account limit of 10. This is the counter that replaces the old IP-keyed
  //    express-rate-limit; without it, spraying is unthrottled.
  //
  // ponytail: asserts that a 429 arrives within 51 attempts, not that it lands on exactly the 51st.
  // randomIp() spoofs x-forwarded-for, which works against a directly-reachable dev server but not
  // behind a platform proxy — Vercel overwrites the header with the real client IP, so every case in
  // this file shares one counter and the cutoff arrives earlier. Verified 2026-08-03 by reading the
  // rows the app wrote: 50 `ip:` rows, exactly 1 distinct key. The security property is that the
  // cutoff exists, not where it sits.
  await t.test("9. Sprayed logins from one IP hit the per-IP cutoff", async () => {
    const sprayIp = randomIp();
    const sprayEmail = (n) => `spray_${Date.now()}_${n}@example.com`;

    let blockedAt = 0;
    for (let i = 1; i <= 51; i++) {
      const r = await hit(NEW_BASE, "POST", "/api/auth/login", {
        ip: sprayIp,
        body: { email: sprayEmail(i), password: "wrongpassword" },
      });
      if (r.status === 429) {
        assert.deepEqual(shapeOf(r.json), ["error"]);
        blockedAt = i;
        break;
      }
      assert.equal(r.status, 401, `Expected 401 or 429 on spray attempt ${i}`);
    }

    assert.ok(blockedAt > 0, "per-IP limit never triggered within 51 attempts");
  });
});
