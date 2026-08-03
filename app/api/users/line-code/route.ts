export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  try {
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    await prisma.user.update({
      where: { id: userId },
      data: { lineLinkCode: code },
    });
    return NextResponse.json({ code });
  } catch (error) {
    console.error("LINE Link Code Error:", error);
    return NextResponse.json({ error: "Failed to generate link code." }, { status: 500 });
  }
}
