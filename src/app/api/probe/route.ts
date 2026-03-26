import { NextResponse } from "next/server";
import { loadReport } from "@/lib/blob";
import { scrapeV2EXPage } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ipProbeMap = new Map<string, number>();
const PROBE_WINDOW_MS = 10_000;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId") || "1200385";

  if (!/^\d+$/.test(postId)) {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }

  const now = Date.now();
  const ip = getClientIP(request);
  const last = ipProbeMap.get(ip) || 0;
  if (now - last < PROBE_WINDOW_MS) {
    return NextResponse.json({ throttled: true, hasUpdate: false });
  }
  ipProbeMap.set(ip, now);

  const existing = await loadReport(postId);
  const page = await scrapeV2EXPage(postId, 1);
  if (!page.meta) {
    return NextResponse.json({ error: "Probe failed" }, { status: 502 });
  }

  const cachedReplyCount = existing?.meta.replyCount ?? null;
  const sourceReplyCount = page.meta.replyCount;
  const hasUpdate =
    !existing ||
    sourceReplyCount !== cachedReplyCount ||
    page.meta.title !== existing.meta.title ||
    page.meta.author !== existing.meta.author;

  return NextResponse.json({
    postId,
    hasUpdate,
    sourceReplyCount,
    cachedReplyCount,
    sourceTitle: page.meta.title,
    cachedTitle: existing?.meta.title ?? null,
    lastFetched: existing?.meta.lastFetched ?? null,
    checkedAt: new Date().toISOString(),
  });
}
