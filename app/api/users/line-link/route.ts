export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";

export async function DELETE(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lineUserId: null, lineLinkCode: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LINE Unlink Error:", error);
    return NextResponse.json({ error: "Failed to unlink LINE account." }, { status: 500 });
  }
}
