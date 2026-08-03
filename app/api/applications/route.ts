export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { Status, type Prisma } from "@/generated/prisma/client";

const createSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().min(1, "Role is required"),
  status: z.nativeEnum(Status).optional(),
  url: z.string().url().optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.enum(["THB", "USD"]).optional(),
  salaryPeriod: z.enum(["MONTHLY", "YEARLY", "HOURLY"]).optional(),
  location: z.string().optional().nullable(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  jobDescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  appliedAt: z.string().datetime().optional().nullable(),
  interviewDate: z.string().datetime().optional().nullable(),
  hrContact: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  const url = new URL(req.url);
  const rawSearchParam = url.searchParams.get("search");
  const rawSearch = typeof rawSearchParam === "string" ? rawSearchParam.trim() : "";

  let whereClause: Prisma.JobApplicationWhereInput = { userId };

  if (rawSearch) {
    const sanitized = rawSearch.replace(/[&|!():*'"]/g, " ").trim().split(/\s+/).filter(Boolean);

    if (sanitized.length > 0) {
      const ftsQuery = sanitized.join(" | ");
      whereClause = {
        userId,
        OR: [
          { company: { search: ftsQuery } },
          { role: { search: ftsQuery } },
        ],
      };
    }
  }

  const applications = await prisma.jobApplication.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const effectiveStatus = d.status ?? "WISHLIST";
  const effectiveAppliedAt =
    d.appliedAt
      ? new Date(d.appliedAt)
      : effectiveStatus !== "WISHLIST"
      ? new Date()
      : undefined;

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      company: d.company,
      role: d.role,
      status: effectiveStatus,
      ...(d.url && { url: d.url }),
      ...(d.salaryMin != null && { salaryMin: d.salaryMin }),
      ...(d.salaryMax != null && { salaryMax: d.salaryMax }),
      ...(d.salaryCurrency && { salaryCurrency: d.salaryCurrency }),
      ...(d.salaryPeriod && { salaryPeriod: d.salaryPeriod }),
      ...(d.location && { location: d.location }),
      ...(d.workMode && { workMode: d.workMode }),
      ...(d.jobDescription && { jobDescription: d.jobDescription }),
      ...(d.notes && { notes: d.notes }),
      ...(d.source && { source: d.source }),
      ...(effectiveAppliedAt && { appliedAt: effectiveAppliedAt }),
      ...(d.interviewDate && { interviewDate: new Date(d.interviewDate) }),
      ...(d.hrContact != null && { hrContact: d.hrContact }),
    },
  });

  return NextResponse.json(application, { status: 201 });
}
