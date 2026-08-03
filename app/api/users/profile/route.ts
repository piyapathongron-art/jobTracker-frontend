export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { checkAndResetQuotas } from "@/lib/quota";

const QUOTA_SELECT = {
  id: true,
  name: true,
  email: true,
  baseResume: true,
  homeLocation: true,
  lineUserId: true,
  lineLinkCode: true,
  tokenUsageTotal: true,
  tokenUsageWindow: true,
  tokenLimit: true,
  scrapeUsageTotal: true,
  scrapeUsageWindow: true,
  scrapeLimit: true,
  nextQuotaReset: true,
} as const;

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  baseResume: z.string().trim().optional(),
  homeLocation: z.string().trim().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  try {
    await checkAndResetQuotas(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: QUOTA_SELECT });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const updateData: { baseResume?: string; name?: string; homeLocation?: string } = {};
    if (parsed.data.baseResume !== undefined) updateData.baseResume = parsed.data.baseResume;
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.homeLocation !== undefined) updateData.homeLocation = parsed.data.homeLocation;

    await prisma.user.update({ where: { id: userId }, data: updateData });
    await checkAndResetQuotas(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: QUOTA_SELECT });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
