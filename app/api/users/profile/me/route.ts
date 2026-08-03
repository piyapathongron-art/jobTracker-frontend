export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";

export async function DELETE(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true, message: "Account permanently deleted." }, { status: 200 });
  } catch (error) {
    console.error("Account Deletion Error:", error);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}
