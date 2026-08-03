export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";

type TrendingRow = { company: string; count: bigint };

function titleCase(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : (w[0]?.toUpperCase() ?? "") + w.slice(1)))
    .join(" ");
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await prisma.$queryRaw<TrendingRow[]>`
      SELECT LOWER(TRIM(company)) AS company, COUNT(*)::int AS count
      FROM "JobApplication"
      WHERE company IS NOT NULL AND TRIM(company) <> ''
      GROUP BY LOWER(TRIM(company))
      HAVING COUNT(*) >= 3
      ORDER BY count DESC, company ASC
      LIMIT 10
    `;

    const trending = rows.map((r) => titleCase(r.company));
    return NextResponse.json(trending);
  } catch (error) {
    console.error("[insights/trending] failed:", error);
    return NextResponse.json({ error: "Failed to load trending companies" }, { status: 500 });
  }
}
