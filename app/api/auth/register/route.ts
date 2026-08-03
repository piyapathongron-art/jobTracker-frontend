export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { checkLoginRate, clientIp } from "@/lib/rateLimit";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email: parsedEmail, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: parsedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: parsedEmail, password: hashed },
    select: { id: true, name: true, email: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return NextResponse.json({ token, user: { ...user, hasResume: false } }, { status: 201 });
}
