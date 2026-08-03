import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;

// Per account+IP: matches the old express-rate-limit authLimiter's 10 per 15 minutes.
const PER_ACCOUNT_LIMIT = 10;

// Per IP, across all accounts. The old limiter keyed on IP alone, which stopped password spraying
// but let one attacker lock out everyone behind the same carrier NAT. Keying only on account+IP
// fixes the lockout but reopens spraying, so both counters run: an innocent shared address stays
// well under 50, while an attacker walking a list of accounts trips it.
const PER_IP_LIMIT = 50;

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function checkLoginRate(email: string, ip: string): Promise<Response | null> {
  const since = new Date(Date.now() - WINDOW_MS);
  const accountKey = `acct:${email}|${ip}`;
  const ipKey = `ip:${ip}`;

  const [accountCount, ipCount] = await Promise.all([
    prisma.loginAttempt.count({ where: { key: accountKey, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { key: ipKey, createdAt: { gte: since } } }),
  ]);

  if (accountCount >= PER_ACCOUNT_LIMIT || ipCount >= PER_IP_LIMIT) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  // ponytail: rows are only pruned for keys that come back. A key that is never seen again keeps its
  // rows forever — a slow leak, bounded by distinct email+IP pairs. Add a weekly cleanup cron if the
  // table ever grows enough to notice.
  await prisma.loginAttempt.deleteMany({
    where: { key: { in: [accountKey, ipKey] }, createdAt: { lt: since } },
  });
  await prisma.loginAttempt.createMany({
    data: [{ key: accountKey }, { key: ipKey }],
  });

  return null;
}
