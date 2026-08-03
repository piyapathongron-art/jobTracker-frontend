// Every run gets its own source address. The auth routes rate-limit per IP as well as per account,
// so without this a second run inside 15 minutes would inherit the first run's counters and fail.
export function randomIp() {
  const o = () => Math.floor(Math.random() * 256);
  return `10.${o()}.${o()}.${o()}`;
}

export async function hit(base, method, path, { body, token, ip } = {}) {
  const url = `${base.replace(/\/$/, "")}${path}`;
  const headers = {};
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }
  if (ip) {
    headers["x-forwarded-for"] = ip;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, json };
}

export function shapeOf(val, prefix = "") {
  if (val === null || val === undefined) {
    return [prefix || "null"];
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return [prefix ? `${prefix}[]` : "[]"];
    const childShapes = shapeOf(val[0], `${prefix}[]`);
    return Array.from(new Set(childShapes)).sort();
  }
  if (typeof val === "object") {
    const keys = Object.keys(val).sort();
    let paths = [];
    for (const key of keys) {
      const p = prefix ? `${prefix}.${key}` : key;
      paths = paths.concat(shapeOf(val[key], p));
    }
    return paths;
  }
  return [prefix];
}
