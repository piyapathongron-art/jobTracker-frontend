export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { assertTokenQuota, incrementTokenUsage } from "@/lib/quota";
import { geminiFlash } from "@/lib/gemini";
import { JOB_COMPARER_PROMPT } from "@/lib/prompts/jobComparer";
import { compareSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const quota = await assertTokenQuota(userId);
  if (!quota.ok) return NextResponse.json(quota.body, { status: quota.status });

  try {
    const [user, jobs] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.jobApplication.findMany({
        where: { id: { in: parsed.data.jobIds }, userId },
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (jobs.length < 2)
      return NextResponse.json(
        { error: "At least 2 valid jobs required for comparison." },
        { status: 400 }
      );

    const inputData = `
User's Home Location: ${user.homeLocation || "Not specified"}
Array of Job Applications: ${JSON.stringify(
      jobs.map((j) => ({
        id: j.id,
        company: j.company,
        role: j.role,
        location: j.location,
        workMode: j.workMode,
        salary: `${j.salaryMin}-${j.salaryMax} ${j.salaryCurrency} (${j.salaryPeriod})`,
        notes: j.notes,
      }))
    )}
    `;

    const result = await geminiFlash.generateContent(JOB_COMPARER_PROMPT + inputData);
    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);
    const responseText = result.response.text().trim();

    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Job Comparer Error:", error);
    return NextResponse.json(
      { error: "AI failed to compare jobs. Please try again." },
      { status: 500 }
    );
  }
}
