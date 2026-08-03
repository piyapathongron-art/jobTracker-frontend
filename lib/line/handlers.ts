import { messagingApi, webhook } from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";
import { geminiFlash } from "@/lib/gemini";
import { JD_PARSER_PROMPT } from "@/lib/prompts/jdParser";
import { CAREER_ADVISOR_PROMPT } from "@/lib/prompts/lineBot";
import { LINE_REPLIES, buildJobSavedFlex } from "@/lib/prompts/lineReplies";
import {
  assertTokenQuota,
  assertScrapeQuota,
  incrementTokenUsage,
  incrementScrapeUsage,
} from "@/lib/quota";

export async function handleEventsBatch(
  events: webhook.Event[],
  client: messagingApi.MessagingApiClient,
  blobClient: messagingApi.MessagingApiBlobClient,
) {
  const handledEvents = new Set<webhook.Event>();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (handledEvents.has(event)) continue;

    if (
      event.type === "message" &&
      (event as webhook.MessageEvent).message.type === "image"
    ) {
      const firstMsgEvent = event as webhook.MessageEvent;
      const lineUserId = firstMsgEvent.source?.userId;

      if (!lineUserId) {
        handledEvents.add(event);
        continue;
      }

      const imageGroup: webhook.MessageEvent[] = [];
      for (let j = i; j < events.length; j++) {
        const ev = events[j];
        if (
          !handledEvents.has(ev) &&
          ev.type === "message" &&
          (ev as webhook.MessageEvent).message.type === "image" &&
          (ev as webhook.MessageEvent).source?.userId === lineUserId
        ) {
          imageGroup.push(ev as webhook.MessageEvent);
          handledEvents.add(ev);
        }
      }

      if (imageGroup.length > 0) {
        try {
          await processImageGroup(imageGroup, client, blobClient);
        } catch (err) {
          console.error("[LINE] image group handler failed:", err);
        }
      }
    } else {
      handledEvents.add(event);
      try {
        await handleEvent(event, client, blobClient);
      } catch (err) {
        console.error("[LINE] event handler failed:", err);
      }
    }
  }
}

export async function handleEvent(
  event: webhook.Event,
  client: messagingApi.MessagingApiClient,
  blobClient: messagingApi.MessagingApiBlobClient,
) {
  if (event.type !== "message") return;
  const messageEvent = event as webhook.MessageEvent;
  const lineUserId = messageEvent.source?.userId;
  const replyToken = messageEvent.replyToken;
  if (!lineUserId || !replyToken) return;

  if (messageEvent.message.type === "image") {
    await processImageGroup([messageEvent], client, blobClient);
    return;
  }

  if (messageEvent.message.type !== "text") return;

  const text = (messageEvent.message as webhook.TextMessageContent).text.trim();

  if (text.toLowerCase() === "/help" || text.toLowerCase() === "help") {
    await reply(client, replyToken, LINE_REPLIES.HELP_MESSAGE);
    return;
  }

  if (/^\d{6}$/.test(text)) {
    await handleLinkCode(text, lineUserId, replyToken, client);
    return;
  }

  const urlMatch = text.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    const hasInstructions = text.replace(urlMatch[0], "").trim().length > 2;
    if (!hasInstructions) {
      await handleJobUrl(urlMatch[0], lineUserId, replyToken, client);
    } else {
      await handleCareerChat(text, lineUserId, replyToken, client, urlMatch[0]);
    }
    return;
  }

  await handleCareerChat(text, lineUserId, replyToken, client);
}

export async function processImageGroup(
  imageEvents: webhook.MessageEvent[],
  client: messagingApi.MessagingApiClient,
  blobClient: messagingApi.MessagingApiBlobClient,
) {
  const firstEvent = imageEvents[0];
  const lineUserId = firstEvent?.source?.userId;
  const replyToken = firstEvent?.replyToken;
  if (!lineUserId || !replyToken) return;

  const messageIds = imageEvents.map(
    (e) => (e.message as webhook.ImageMessageContent).id
  );

  const user = await prisma.user.findUnique({ where: { lineUserId } });
  if (!user) {
    await reply(client, replyToken, LINE_REPLIES.NOT_LINKED);
    return;
  }

  const tokenCheck = await assertTokenQuota(user.id, "line");
  if (!tokenCheck.ok) {
    await reply(client, replyToken, tokenCheck.body.error);
    return;
  }

  try {
    const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];
    for (const messageId of messageIds) {
      const stream = await blobClient.getMessageContent(messageId);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      imageParts.push({
        inlineData: {
          data: Buffer.concat(chunks).toString("base64"),
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await geminiFlash.generateContent([
      { text: JD_PARSER_PROMPT },
      ...imageParts,
    ]);
    incrementTokenUsage(user.id, result.response.usageMetadata?.totalTokenCount);

    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(jsonStr);

    if (parsed.isJobDescription === false) {
      await reply(client, replyToken, LINE_REPLIES.NOT_A_JOB);
      return;
    }

    await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company: parsed.company ?? "Unknown",
        role: parsed.role ?? "Unknown",
        status: "WISHLIST",
        url: null,
        salaryMin: parsed.salaryMin ?? null,
        salaryMax: parsed.salaryMax ?? null,
        salaryCurrency: parsed.salaryCurrency ?? "THB",
        salaryPeriod: parsed.salaryPeriod ?? "MONTHLY",
        location: parsed.location ?? null,
        workMode: parsed.workMode ?? "ONSITE",
        jobDescription: parsed.jobDescription ?? null,
        notes: parsed.notes ?? null,
        source: "Image Screenshot",
        hrContact: parsed.hrContact ?? null,
      },
    });

    const newTokens =
      tokenCheck.user.tokenUsageWindow +
      (result.response.usageMetadata?.totalTokenCount || 0);
    const resetsAt = tokenCheck.user.nextQuotaReset.toISOString().slice(0, 10);
    const tokensInfo = `[Tokens: ${newTokens.toLocaleString()}/${tokenCheck.user.tokenLimit.toLocaleString()} | Resets: ${resetsAt}]`;

    const extraTexts: string[] = [
      LINE_REPLIES.JOB_SAVED_IMAGE(
        parsed.role ?? "Role",
        parsed.company ?? "Company",
        ""
      ).trim(),
    ];
    if (!parsed.hrContact)
      extraTexts.push(LINE_REPLIES.MISSING_HR_CONTACT_WARNING.trim());

    await replyFlex(
      client,
      replyToken,
      buildJobSavedFlex({
        role: parsed.role ?? "Role",
        company: parsed.company ?? "Company",
        location: parsed.location,
        workMode: parsed.workMode,
        salaryMin: parsed.salaryMin,
        salaryMax: parsed.salaryMax,
        salaryCurrency: parsed.salaryCurrency,
        hrContact: parsed.hrContact,
        tokensInfo,
        source: "จากรูปภาพ",
      }),
      extraTexts
    );
  } catch (err) {
    console.error("[LINE] buffered image processing failed:", err);
    await reply(client, replyToken, LINE_REPLIES.JOB_SAVED_IMAGE_ERROR);
  }
}

export async function handleLinkCode(
  code: string,
  lineUserId: string,
  replyToken: string,
  client: messagingApi.MessagingApiClient,
) {
  const user = await prisma.user.findFirst({ where: { lineLinkCode: code } });
  if (!user) {
    await reply(client, replyToken, LINE_REPLIES.LINK_CODE_INVALID);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lineUserId, lineLinkCode: null },
  });

  await reply(client, replyToken, LINE_REPLIES.LINK_SUCCESS(user.name));
}

export async function handleJobUrl(
  url: string,
  lineUserId: string,
  replyToken: string,
  client: messagingApi.MessagingApiClient,
) {
  const user = await prisma.user.findUnique({ where: { lineUserId } });
  if (!user) {
    await reply(client, replyToken, LINE_REPLIES.NOT_LINKED);
    return;
  }

  const scrapeCheck = await assertScrapeQuota(user.id, "line");
  if (!scrapeCheck.ok) {
    await reply(client, replyToken, scrapeCheck.body.error);
    return;
  }
  const tokenCheck = await assertTokenQuota(user.id, "line");
  if (!tokenCheck.ok) {
    await reply(client, replyToken, tokenCheck.body.error);
    return;
  }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    await reply(client, replyToken, LINE_REPLIES.NO_SCRAPER);
    return;
  }

  try {
    const fcResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });

    if (!fcResp.ok) {
      await reply(client, replyToken, LINE_REPLIES.SCRAPE_BLOCKED);
      return;
    }

    const fcJson = (await fcResp.json()) as { data?: { markdown?: string } };
    const markdown = (fcJson.data?.markdown ?? "").trim();
    if (markdown.length < 50) {
      await reply(client, replyToken, LINE_REPLIES.SCRAPE_NO_CONTENT);
      return;
    }

    incrementScrapeUsage(user.id);

    const result = await geminiFlash.generateContent(
      JD_PARSER_PROMPT + markdown.slice(0, 30_000),
    );
    incrementTokenUsage(user.id, result.response.usageMetadata?.totalTokenCount);

    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(jsonStr);

    if (parsed.isJobDescription === false) {
      await reply(client, replyToken, LINE_REPLIES.NOT_A_JOB);
      return;
    }

    await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company: parsed.company ?? "Unknown",
        role: parsed.role ?? "Unknown",
        status: "WISHLIST",
        url,
        salaryMin: parsed.salaryMin ?? null,
        salaryMax: parsed.salaryMax ?? null,
        salaryCurrency: parsed.salaryCurrency ?? "THB",
        salaryPeriod: parsed.salaryPeriod ?? "MONTHLY",
        location: parsed.location ?? null,
        workMode: parsed.workMode ?? "ONSITE",
        jobDescription: parsed.jobDescription ?? null,
        notes: parsed.notes ?? null,
        source: detectSource(url),
        hrContact: parsed.hrContact ?? null,
      },
    });

    const newTokens = tokenCheck.user.tokenUsageWindow + (result.response.usageMetadata?.totalTokenCount || 0);
    const newScrapes = scrapeCheck.user.scrapeUsageWindow + 1;
    const resetsAt = tokenCheck.user.nextQuotaReset.toISOString().slice(0, 10);

    const tokensInfo = `[Tokens: ${newTokens.toLocaleString()}/${tokenCheck.user.tokenLimit.toLocaleString()} | Scrapes: ${newScrapes}/${scrapeCheck.user.scrapeLimit} | Resets: ${resetsAt}]`;

    const extraTexts: string[] = [];
    if (!parsed.hrContact) extraTexts.push(LINE_REPLIES.MISSING_HR_CONTACT_WARNING.trim());

    await replyFlex(client, replyToken, buildJobSavedFlex({
      role: parsed.role ?? "Role",
      company: parsed.company ?? "Company",
      location: parsed.location,
      workMode: parsed.workMode,
      salaryMin: parsed.salaryMin,
      salaryMax: parsed.salaryMax,
      salaryCurrency: parsed.salaryCurrency,
      hrContact: parsed.hrContact,
      tokensInfo,
      source: "จากลิงก์",
    }), extraTexts);
  } catch (err) {
    console.error("[LINE] job url handler failed:", err);
    await reply(client, replyToken, LINE_REPLIES.JOB_SAVED_URL_ERROR);
  }
}

export async function handleCareerChat(
  text: string,
  lineUserId: string,
  replyToken: string,
  client: messagingApi.MessagingApiClient,
  url?: string,
) {
  const user = await prisma.user.findUnique({ where: { lineUserId } });
  if (!user) {
    await reply(client, replyToken, LINE_REPLIES.NOT_LINKED);
    return;
  }

  const tokenCheck = await assertTokenQuota(user.id, "line");
  if (!tokenCheck.ok) {
    await reply(client, replyToken, tokenCheck.body.error);
    return;
  }

  try {
    let scrapedMarkdown = "";
    if (url) {
      const scrapeCheck = await assertScrapeQuota(user.id, "line");
      if (!scrapeCheck.ok) {
        await reply(client, replyToken, scrapeCheck.body.error);
        return;
      }
      const firecrawlKey = process.env.FIRECRAWL_API_KEY;
      if (firecrawlKey) {
        try {
          const fcResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, formats: ["markdown"] }),
          });
          if (fcResp.ok) {
            const fcJson = (await fcResp.json()) as { data?: { markdown?: string } };
            const markdown = (fcJson.data?.markdown ?? "").trim();
            if (markdown.length >= 50) {
              scrapedMarkdown = markdown.slice(0, 30_000);
              incrementScrapeUsage(user.id);
            }
          }
        } catch {
          // Scrape failure is non-fatal; proceed without scraped content
        }
      }
    }

    const activeJobs = await prisma.jobApplication.findMany({
      where: { userId: user.id, status: { notIn: ["REJECTED", "GHOSTED"] } },
      select: { id: true, company: true, role: true, status: true, appliedAt: true },
      take: 30,
      orderBy: { updatedAt: "desc" },
    });

    const contextLine =
      activeJobs.length > 0
        ? `Context: The user has the following active job applications (up to 30 most recent): ${activeJobs
            .map(
              (j) =>
                `ID: ${j.id}, Company: ${j.company}, Role: ${j.role}, Status: ${j.status}${
                  j.appliedAt ? `, Applied: ${j.appliedAt.toISOString().slice(0, 10)}` : ""
                }`,
            )
            .join("; ")}.`
        : "Context: The user has no active job applications yet.";

    let prompt = `${CAREER_ADVISOR_PROMPT}\n\n${contextLine}\n\nUser's message: ${text}`;
    if (scrapedMarkdown) {
      prompt += `\n\n[Scraped content from URL]: ${scrapedMarkdown}`;
    }

    const result = await geminiFlash.generateContent(prompt);
    incrementTokenUsage(user.id, result.response.usageMetadata?.totalTokenCount);

    const newTokens = tokenCheck.user.tokenUsageWindow + (result.response.usageMetadata?.totalTokenCount || 0);
    const resetsAt = tokenCheck.user.nextQuotaReset.toISOString().slice(0, 10);

    const rawText = result.response.text().trim();
    let jsonStr = rawText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    let replyText = rawText;
    let jobToSave: {
      company?: string;
      role?: string;
      salaryMin?: number | null;
      salaryMax?: number | null;
      notes?: string | null;
      interviewDate?: string | null;
    } | null = null;
    let jobToUpdate: {
      id?: string;
      url?: string | null;
      notes?: string | null;
      status?: string | null;
    } | null = null;

    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed.replyText === "string" && parsed.replyText.trim().length > 0) {
        replyText = parsed.replyText;
      }
      if (parsed.jobToSave && typeof parsed.jobToSave === "object") {
        jobToSave = parsed.jobToSave;
      }
      if (parsed.jobToUpdate && typeof parsed.jobToUpdate === "object") {
        jobToUpdate = parsed.jobToUpdate;
      }
    } catch {
      // Fallback: use raw text as replyText.
    }

    if (jobToSave && jobToSave.company && jobToSave.role) {
      await prisma.jobApplication.create({
        data: {
          userId: user.id,
          company: jobToSave.company,
          role: jobToSave.role,
          status: jobToSave.interviewDate ? "INTERVIEWING" : "WISHLIST",
          url: null,
          salaryMin: jobToSave.salaryMin ?? null,
          salaryMax: jobToSave.salaryMax ?? null,
          salaryCurrency: "THB",
          salaryPeriod: "MONTHLY",
          location: null,
          workMode: "ONSITE",
          jobDescription: null,
          notes: jobToSave.notes ?? null,
          source: "Manual Text",
          interviewDate: jobToSave.interviewDate ? new Date(jobToSave.interviewDate) : null,
        },
      });
      replyText += LINE_REPLIES.JOB_SAVED_TEXT;
    }

    if (jobToUpdate && jobToUpdate.id) {
      await prisma.jobApplication.update({
        where: { id: jobToUpdate.id },
        data: {
          ...(jobToUpdate.url != null ? { url: jobToUpdate.url } : {}),
          ...(jobToUpdate.notes != null ? { notes: jobToUpdate.notes } : {}),
          ...(jobToUpdate.status
            ? {
                status: jobToUpdate.status as
                  | "WISHLIST"
                  | "APPLIED"
                  | "INTERVIEWING"
                  | "OFFERED"
                  | "REJECTED"
                  | "GHOSTED",
              }
            : {}),
        },
      });
    }

    if (!replyText.trim()) {
      replyText = LINE_REPLIES.CHAT_FALLBACK;
    }

    await reply(
      client,
      replyToken,
      `${replyText.slice(0, 4800)}\n\n[Tokens: ${newTokens.toLocaleString()}/${tokenCheck.user.tokenLimit.toLocaleString()} | Resets: ${resetsAt}]`,
    );
  } catch (err) {
    console.error("[LINE] career chat failed:", err);
    await reply(client, replyToken, LINE_REPLIES.CHAT_ERROR);
  }
}

export async function reply(
  client: messagingApi.MessagingApiClient,
  replyToken: string,
  text: string,
) {
  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export async function replyFlex(
  client: messagingApi.MessagingApiClient,
  replyToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flexMessage: any,
  extraTexts?: string[],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [flexMessage];
  for (const text of extraTexts ?? []) {
    messages.push({ type: "text", text });
  }
  await client.replyMessage({ replyToken, messages });
}

export function detectSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("jobsdb")) return "JobsDB";
    if (hostname.includes("indeed")) return "Indeed";
    if (hostname.includes("glassdoor")) return "Glassdoor";
    if (hostname.includes("workday") || hostname.includes("myworkdayjobs")) return "Workday";
    if (hostname.includes("greenhouse")) return "Greenhouse";
    if (hostname.includes("lever")) return "Lever";
    if (hostname.includes("ashby")) return "Ashby";
    if (hostname.includes("wellfound") || hostname.includes("angel")) return "Wellfound";
    if (hostname.includes("seek")) return "Seek";
    return "Company Site";
  } catch {
    return "Other";
  }
}
