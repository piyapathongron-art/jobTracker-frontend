export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { assertTokenQuota, incrementTokenUsage } from "@/lib/quota";
import { geminiFlash } from "@/lib/gemini";
import { RESUME_OPTIMIZER_PROMPT } from "@/lib/prompts/resumeOptimizer";
import { optimizeSchema } from "@/lib/ai/schemas";

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

  const parsed = optimizeSchema.safeParse(body);
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
Target Job Role: ${job.role}
Target Company: ${job.company}
Job Description: ${job.jobDescription || "Not provided"}
Personal Notes: ${job.notes || "No additional context provided."}
Previous AI Evaluation: ${JSON.stringify(parsed.data.scoreData)}
    `;

    if (parsed.data.feedback) {
      inputData += `\n\nUser Revision Feedback: "${parsed.data.feedback}"\nCRITICAL INSTRUCTION: You must strictly adjust your rewrite to incorporate this guidance while maintaining the exact required JSON schema and bilingual format.`;
    }

    const result = await geminiFlash.generateContent(RESUME_OPTIMIZER_PROMPT + inputData);
    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);
    const responseText = result.response.text().trim();

    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Resume Optimizer Error:", error);
    return NextResponse.json(
      { error: "AI failed to optimize the resume. Please try again." },
      { status: 500 }
    );
  }
}
