import { NextResponse } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export function isAuthError(r: JwtPayload | Response): r is Response {
  return r instanceof Response;
}

export async function requireAuth(req: Request): Promise<JwtPayload | Response> {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization header" },
      { status: 401 }
    );
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);

    // Verify user still exists in DB (especially after migrations/resets)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User no longer exists. Please log in again." },
        { status: 401 }
      );
    }

    return payload;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
