export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth";
import {
  assertTokenQuota,
  assertScrapeQuota,
  incrementTokenUsage,
  incrementScrapeUsage,
} from "@/lib/quota";
import { geminiFlash } from "@/lib/gemini";
import { JD_PARSER_PROMPT } from "@/lib/prompts/jdParser";
import { scrapeUrlSchema } from "@/lib/ai/schemas";
import { detectSourceFromUrl } from "@/lib/ai/detectSource";

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

  const parsed = scrapeUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
      { status: 400 }
    );
  }

  const tokenQuota = await assertTokenQuota(userId);
  if (!tokenQuota.ok) return NextResponse.json(tokenQuota.body, { status: tokenQuota.status });
  const scrapeQuota = await assertScrapeQuota(userId);
  if (!scrapeQuota.ok) return NextResponse.json(scrapeQuota.body, { status: scrapeQuota.status });

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    return NextResponse.json(
      {
        error: "Scraper not configured. Add FIRECRAWL_API_KEY to your server .env.local.",
      },
      { status: 500 }
    );
  }

  try {
    const fcResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: parsed.data.url,
        formats: ["markdown"],
      }),
    });

    if (!fcResp.ok) {
      const errBody = await fcResp.text().catch(() => "");
      console.error("Firecrawl error:", fcResp.status, errBody);
      return NextResponse.json(
        {
          error: "Could not fetch the job posting. The site may be blocking scrapers — try pasting the JD manually.",
        },
        { status: 502 }
      );
    }

    const fcJson = (await fcResp.json()) as { success?: boolean; data?: { markdown?: string }; error?: string };
    const markdown = (fcJson.data?.markdown ?? "").trim();

    if (!markdown || markdown.length < 50) {
      return NextResponse.json(
        {
          error: "Page content was empty or too short. Try pasting the JD manually.",
        },
        { status: 422 }
      );
    }

    const result = await geminiFlash.generateContent(JD_PARSER_PROMPT + markdown.slice(0, 30_000));
    incrementTokenUsage(userId, result.response.usageMetadata?.totalTokenCount);
    const responseText = result.response.text().trim();

    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);
    data.url = parsed.data.url;
    data.source = detectSourceFromUrl(parsed.data.url);

    incrementScrapeUsage(userId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Scrape URL Error:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape the URL. Please try pasting the JD manually.",
      },
      { status: 500 }
    );
  }
}
