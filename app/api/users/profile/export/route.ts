export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        baseResume: true,
        homeLocation: true,
        lineUserId: true,
        tokenUsageTotal: true,
        tokenUsageWindow: true,
        tokenLimit: true,
        scrapeUsageTotal: true,
        scrapeUsageWindow: true,
        scrapeLimit: true,
        nextQuotaReset: true,
        createdAt: true,
        // Explicitly exclude: password, lineLinkCode, updatedAt (not in schema)
        applications: {
          select: {
            id: true,
            company: true,
            role: true,
            status: true,
            url: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            salaryPeriod: true,
            location: true,
            workMode: true,
            source: true,
            jobDescription: true,
            notes: true,
            appliedAt: true,
            interviewDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Data Export Error:", error);
    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
}
