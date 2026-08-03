import { prisma } from "./prisma";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type QuotaUser = {
  id: string;
  tokenUsageTotal: number;
  tokenUsageWindow: number;
  tokenLimit: number;
  scrapeUsageTotal: number;
  scrapeUsageWindow: number;
  scrapeLimit: number;
  nextQuotaReset: Date;
};

export async function checkAndResetQuotas(userId: string): Promise<QuotaUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tokenUsageTotal: true,
      tokenUsageWindow: true,
      tokenLimit: true,
      scrapeUsageTotal: true,
      scrapeUsageWindow: true,
      scrapeLimit: true,
      nextQuotaReset: true,
    },
  });
  if (!user) return null;

  if (new Date() > user.nextQuotaReset) {
    const nextReset = new Date(Date.now() + WINDOW_MS);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenUsageWindow: 0,
        scrapeUsageWindow: 0,
        nextQuotaReset: nextReset,
      },
      select: {
        id: true,
        tokenUsageTotal: true,
        tokenUsageWindow: true,
        tokenLimit: true,
        scrapeUsageTotal: true,
        scrapeUsageWindow: true,
        scrapeLimit: true,
        nextQuotaReset: true,
      },
    });
    return updated;
  }

  return user;
}

export type QuotaCheckResult =
  | { ok: true; user: QuotaUser }
  | { ok: false; status: number; body: { error: string } };

export async function assertTokenQuota(userId: string, source: "web" | "line" = "web"): Promise<QuotaCheckResult> {
  const user = await checkAndResetQuotas(userId);
  if (!user) return { ok: false, status: 404, body: { error: "User not found." } };
  if (user.tokenUsageWindow >= user.tokenLimit) {
    const errorMsg = source === "line"
      ? `แงงงง 🥺 ตอนนี้พลังงานของจ๊อบแจ๊บ (AI Tokens) หมดโควต้าแล้วค่ะ (${user.tokenLimit.toLocaleString()} tokens)\n\nจ๊อบแจ๊บขอตัวไปพักชาร์จแบตก่อนน้า 🌸 พลังงานจะกลับมาเต็มอีกครั้งวันที่ ${user.nextQuotaReset.toISOString().slice(0, 10)} ค่ะ\n\nถ้าพี่ๆ ต้องการใช้งานต่อทันที ลองตรวจสอบการเติมโควต้าดูนะคะ ✨`
      : `Weekly AI token limit reached (${user.tokenLimit.toLocaleString()}). Resets ${user.nextQuotaReset.toISOString()}.`;
    return {
      ok: false,
      status: 403,
      body: { error: errorMsg },
    };
  }
  return { ok: true, user };
}

export async function assertScrapeQuota(userId: string, source: "web" | "line" = "web"): Promise<QuotaCheckResult> {
  const user = await checkAndResetQuotas(userId);
  if (!user) return { ok: false, status: 404, body: { error: "User not found." } };
  if (user.scrapeUsageWindow >= user.scrapeLimit) {
    const errorMsg = source === "line"
      ? `แงงงง 🥺 ตอนนี้โควต้าการอ่านลิงก์ของจ๊อบแจ๊บหมดแล้วค่ะ (${user.scrapeLimit} URLs)\n\nจ๊อบแจ๊บขอพักสายตาก่อนน้า 🌸 โควต้าจะกลับมาอีกครั้งวันที่ ${user.nextQuotaReset.toISOString().slice(0, 10)} ค่ะ\n\nถ้าพี่ๆ ต้องการอ่านลิงก์ต่อทันที ลองตรวจสอบการเติมโควต้าดูนะคะ ✨`
      : `Weekly URL scrape limit reached (${user.scrapeLimit}). Resets ${user.nextQuotaReset.toISOString()}.`;
    return {
      ok: false,
      status: 403,
      body: { error: errorMsg },
    };
  }
  return { ok: true, user };
}

export function incrementTokenUsage(userId: string, usage: number | undefined) {
  if (!usage || usage <= 0) return;
  prisma.user
    .update({
      where: { id: userId },
      data: {
        tokenUsageTotal: { increment: usage },
        tokenUsageWindow: { increment: usage },
      },
    })
    .catch((err) => console.error("Failed to increment token usage:", err));
}

export function incrementScrapeUsage(userId: string) {
  prisma.user
    .update({
      where: { id: userId },
      data: {
        scrapeUsageTotal: { increment: 1 },
        scrapeUsageWindow: { increment: 1 },
      },
    })
    .catch((err) => console.error("Failed to increment scrape usage:", err));
}
