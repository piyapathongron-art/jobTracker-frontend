import { NextResponse } from "next/server";
import { validateSignature, messagingApi, webhook } from "@line/bot-sdk";
import { waitUntil } from "@vercel/functions";
import { handleEventsBatch } from "@/lib/line/handlers";

export const maxDuration = 60;

export async function POST(req: Request) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelAccessToken || !channelSecret) {
    return NextResponse.json(
      { error: "LINE bot not configured on this server." },
      { status: 503 }
    );
  }

  const raw = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!validateSignature(raw, channelSecret, signature)) {
    return NextResponse.json(
      { error: "Invalid LINE signature." },
      { status: 401 }
    );
  }

  let body: webhook.CallbackRequest;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const events = body.events ?? [];

  const lineClient = new messagingApi.MessagingApiClient({ channelAccessToken });
  const lineBlobClient = new messagingApi.MessagingApiBlobClient({ channelAccessToken });

  waitUntil(
    (async () => {
      await handleEventsBatch(events, lineClient, lineBlobClient);
    })()
  );

  return NextResponse.json({ ok: true });
}
