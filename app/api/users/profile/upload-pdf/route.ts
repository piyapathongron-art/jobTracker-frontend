export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth";
import { geminiFlash } from "@/lib/gemini";
import { PDF_RESUME_PARSER_PROMPT } from "@/lib/prompts/pdfResumeParser";
import { assertTokenQuota, incrementTokenUsage } from "@/lib/quota";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const userId = auth.userId;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const file = form.get("resume");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file uploaded." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }

  // ponytail: deployment platform caps request bodies at 4.5 MB; reject >4 MB here for a clear 413 error message
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "PDF is too large. Please upload a file under 4MB." },
      { status: 413 }
    );
  }

  const quota = await assertTokenQuota(userId);
  if (!quota.ok) {
    return NextResponse.json(quota.body, { status: quota.status });
  }

  try {
    const base64String = Buffer.from(await file.arrayBuffer()).toString("base64");

    const result = await geminiFlash.generateContent([
      PDF_RESUME_PARSER_PROMPT,
      {
        inlineData: {
          data: base64String,
          mimeType: "application/pdf",
        },
      },
    ]);

    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);

    const markdownText = result.response.text().trim();

    await prisma.user.update({
      where: { id: userId },
      data: { baseResume: markdownText },
    });

    return NextResponse.json({ baseResume: markdownText });
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json(
      { error: "AI failed to extract text from your PDF. Please try again or paste manually." },
      { status: 500 }
    );
  }
}
