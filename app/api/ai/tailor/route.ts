export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { assertTokenQuota, incrementTokenUsage } from "@/lib/quota";
import { geminiFlash } from "@/lib/gemini";
import { RESUME_TAILOR_PROMPT } from "@/lib/prompts/resumeTailor";
import { tailorSchema } from "@/lib/ai/schemas";

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

  const parsed = tailorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const quota = await assertTokenQuota(userId);
  if (!quota.ok) return NextResponse.json(quota.body, { status: quota.status });

  try {
    const [user, job] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.jobApplication.findUnique({ where: { id: parsed.data.jobId } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (!job) return NextResponse.json({ error: "Job application not found." }, { status: 404 });
    if (!user.baseResume) {
      return NextResponse.json(
        { error: "Please upload your master resume in Profile settings first." },
        { status: 400 }
      );
    }

    let inputData = `
Master Resume: ${user.baseResume}
Job Title: ${job.role}
Company: ${job.company}
Job Description: ${job.jobDescription || "N/A"}
Candidate's Personal Notes (Insider Info/Benefits/Context): ${job.notes || "None"}
    `;

    if (parsed.data.feedback) {
      inputData += `\n\nUser Revision Feedback: "${parsed.data.feedback}"\nCRITICAL INSTRUCTION: You must strictly adjust your output to incorporate this feedback while maintaining the exact required JSON schema and bilingual format.`;
    }

    const result = await geminiFlash.generateContent(RESUME_TAILOR_PROMPT + inputData);
    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);
    const responseText = result.response.text().trim();

    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Tailor Error:", error);
    return NextResponse.json(
      { error: "AI failed to generate tailored content." },
      { status: 500 }
    );
  }
}
