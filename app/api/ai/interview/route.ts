export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { assertTokenQuota, incrementTokenUsage } from "@/lib/quota";
import { geminiFlash } from "@/lib/gemini";
import { INTERVIEW_SIM_PROMPT } from "@/lib/prompts/interviewSim";
import { interviewSchema } from "@/lib/ai/schemas";

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

  const parsed = interviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const quota = await assertTokenQuota(userId);
  if (!quota.ok) return NextResponse.json(quota.body, { status: quota.status });

  try {
    const job = await prisma.jobApplication.findUnique({ where: { id: parsed.data.jobId } });

    if (!job) return NextResponse.json({ error: "Job application not found." }, { status: 404 });

    let inputData = `
Job Title (Role): ${job.role}
Company Name: ${job.company}
Job Description: ${job.jobDescription || "Not provided"}
Personal Notes: ${job.notes || "No additional context provided."}
    `;

    if (parsed.data.feedback) {
      inputData += `\n\nUser Revision Feedback: "${parsed.data.feedback}"\nCRITICAL INSTRUCTION: You must strictly adjust your output to incorporate this feedback while maintaining the exact required JSON schema and bilingual format.`;
    }

    const result = await geminiFlash.generateContent(INTERVIEW_SIM_PROMPT + inputData);
    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);
    const responseText = result.response.text().trim();

    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Interview Sim Error:", error);
    return NextResponse.json(
      { error: "AI failed to generate interview questions. Please try again." },
      { status: 500 }
    );
  }
}
