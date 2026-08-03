export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { checkLoginRate, clientIp } from "@/lib/rateLimit";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleSchema = z.object({
  token: z.string().min(1, "Google token is required"),
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
  // A Google request body carries only `token`, so `email` is always "" here — the account key
  // collapses to a per-IP counter at limit 10, which is what express-rate-limit did for this route.
  const rateLimitRes = await checkLoginRate(email, clientIp(req));
  if (rateLimitRes) return rateLimitRes;

  const parsed = googleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 400 });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Google authentication failed" }, { status: 400 });
    }

    const { email: googleEmail, name } = payload;

    let user = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleEmail,
          name: name || googleEmail.split("@")[0],
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return NextResponse.json(
      {
        token,
        user: { id: user.id, name: user.name, email: user.email, hasResume: !!user.baseResume },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: "Google verification failed" }, { status: 401 });
  }
}
