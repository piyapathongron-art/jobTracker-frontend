export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { Status } from "@/generated/prisma/client";

const patchSchema = z.object({
  company: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const updated = await prisma.jobApplication.updateMany({
    where: { id, userId },
    data: {
      ...data,
      ...(data.appliedAt !== undefined && {
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
      }),
      ...(data.interviewDate !== undefined && {
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : null,
      }),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const record = await prisma.jobApplication.findUnique({ where: { id } });
  return NextResponse.json(record);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  const { id } = await params;

  const deleted = await prisma.jobApplication.deleteMany({
    where: { id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
