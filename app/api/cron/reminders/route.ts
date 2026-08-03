import { NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIMEZONE = process.env.CRON_TIMEZONE ?? "Asia/Bangkok";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return NextResponse.json(
      { error: "LINE bot not configured." },
      { status: 503 }
    );
  }

  const lineClient = new messagingApi.MessagingApiClient({ channelAccessToken });

  try {
    await sendInterviewReminders(lineClient);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CRON] interview reminder failed:", err);
    return NextResponse.json(
      { error: "Cron execution failed." },
      { status: 500 }
    );
  }
}

async function sendInterviewReminders(
  client: messagingApi.MessagingApiClient
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const interviews = await prisma.jobApplication.findMany({
    where: {
      status: "INTERVIEWING",
      interviewDate: { gte: start, lt: end },
    },
    include: { user: { select: { lineUserId: true } } },
  });

  for (const job of interviews) {
    const lineUserId = job.user.lineUserId;
    if (!lineUserId) continue;

    const time = job.interviewDate
      ? job.interviewDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: TIMEZONE,
        })
      : "(time not set)";

    const text = `Reminder: You have an interview with ${job.company} tomorrow at ${time}!`;

    try {
      await client.pushMessage({
        to: lineUserId,
        messages: [{ type: "text", text }],
      });
    } catch (err) {
      console.error(`[CRON] push failed for user ${lineUserId}:`, err);
    }
  }
}
