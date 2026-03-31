import { NextResponse } from "next/server";
import { scrapeV2EXPage } from "@/lib/scraper";
import { analyzeComments } from "@/lib/analyzer";
import { saveReport, loadReport } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOT_POST_ID = "1200385";
const ONE_MINUTE_MS = 60 * 1000;
const DEFAULT_STALE_MS = ONE_MINUTE_MS;
const HOT_STALE_MS = ONE_MINUTE_MS;
const DEFAULT_POST_COOLDOWN_MS = ONE_MINUTE_MS;
const HOT_POST_COOLDOWN_MS = ONE_MINUTE_MS;

// Rate limiting: 1/min per IP, 1/hour per postId
const ipLimitMap = new Map<string, number>();
const postLimitMap = new Map<string, number>();

function getStaleWindow(postId: string): number {
  return postId === HOT_POST_ID ? HOT_STALE_MS : DEFAULT_STALE_MS;
}

function getPostCooldown(postId: string): number {
  return postId === HOT_POST_ID ? HOT_POST_COOLDOWN_MS : DEFAULT_POST_COOLDOWN_MS;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const postId = body.postId as string;

  if (!postId || !/^\d+$/.test(postId)) {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }

  const now = Date.now();
  const ip = getClientIP(request);

  // Per-IP rate limit
  const lastIp = ipLimitMap.get(ip) || 0;
  if (now - lastIp < 60_000) {
    return NextResponse.json({ fresh: true });
  }

  // Per-postId cooldown
  const lastPost = postLimitMap.get(postId) || 0;
  if (now - lastPost < getPostCooldown(postId)) {
    return NextResponse.json({ fresh: true });
  }

  // Check if data is actually stale
  try {
    const existing = await loadReport(postId);
    if (existing) {
      const fetched = new Date(existing.meta.lastFetched).getTime();
      if (now - fetched < getStaleWindow(postId)) {
        return NextResponse.json({ fresh: true });
      }
    }
  } catch {
    // No existing data or blob error — proceed with refresh
  }

  ipLimitMap.set(ip, now);
  postLimitMap.set(postId, now);

  try {
    // Only scrape page 1 to stay within 10s timeout
    const page1 = await scrapeV2EXPage(postId, 1);
    if (!page1.meta) {
      return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
    }

    const raw = {
      postId,
      title: page1.meta.title,
      author: page1.meta.author,
      url: `https://www.v2ex.com/t/${postId}`,
      viewCount: page1.meta.viewCount,
      favoriteCount: page1.meta.favoriteCount,
      replyCount: page1.meta.replyCount,
      totalPages: page1.meta.totalPages,
      comments: page1.comments,
    };

    // Try page 2 if time allows (single-page posts are most common)
    if (page1.meta.totalPages >= 2) {
      try {
        const page2 = await scrapeV2EXPage(postId, 2, page1.comments.length + 1);
        raw.comments.push(...page2.comments);
      } catch {
        // Timeout or error — proceed with page 1 data only
      }
    }

    const report = analyzeComments(raw);
    await saveReport(postId, report);

    revalidatePath("/");
    revalidatePath(`/t/${postId}`);

    return NextResponse.json({ refreshed: true, comments: report.comments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
