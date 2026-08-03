export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { checkLoginRate, clientIp } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const bodyObj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const email = typeof bodyObj.email === "string" ? bodyObj.email.trim().toLowerCase() : "";
  const rateLimitRes = await checkLoginRate(email, clientIp(req));
  if (rateLimitRes) return rateLimitRes;

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email: parsedEmail, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: parsedEmail } });
  if (!user || !user.password) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = signToken({ userId: user.id, email: user.email });
  return NextResponse.json(
    {
      token,
      user: { id: user.id, name: user.name, email: user.email, hasResume: !!user.baseResume },
    },
    { status: 200 }
  );
}
