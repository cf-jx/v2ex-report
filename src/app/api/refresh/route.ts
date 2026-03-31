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
const REFRESH_LOCK_MS = 45 * 1000;

// Keep a short-lived in-flight lock so multiple visitors do not stampede
// the same refresh job while still allowing stale data to recover quickly.
const postRefreshLockMap = new Map<string, number>();

function getStaleWindow(postId: string): number {
  return postId === HOT_POST_ID ? HOT_STALE_MS : DEFAULT_STALE_MS;
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
  const staleWindow = getStaleWindow(postId);

  let isStale = true;

  try {
    const existing = await loadReport(postId);
    if (existing) {
      const fetched = new Date(existing.meta.lastFetched).getTime();
      isStale = now - fetched >= staleWindow;
    }
  } catch {
    // No existing data or blob error — treat as stale and proceed
  }

  if (!isStale) {
    return NextResponse.json({ fresh: true });
  }

  const lockedAt = postRefreshLockMap.get(postId) || 0;
  if (now - lockedAt < REFRESH_LOCK_MS) {
    return NextResponse.json({ refreshing: true, fresh: false });
  }

  postRefreshLockMap.set(postId, now);

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
  } finally {
    postRefreshLockMap.delete(postId);
  }
}
