import { NextResponse } from "next/server";
import { scrapeV2EXPage } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting: 10 calls/min per IP
const rateLimitMap = new Map<string, number[]>();
const WINDOW = 60 * 1000;
const MAX_CALLS = 10;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const startId = parseInt(searchParams.get("startId") || "1", 10);

  if (!postId || !/^\d+$/.test(postId)) {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }
  if (page < 1 || page > 20) {
    return NextResponse.json({ error: "Invalid page (1-20)" }, { status: 400 });
  }

  // Rate limit
  const ip = getClientIP(request);
  const now = Date.now();
  const calls = (rateLimitMap.get(ip) || []).filter((t) => now - t < WINDOW);
  if (calls.length >= MAX_CALLS) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  calls.push(now);
  rateLimitMap.set(ip, calls);

  try {
    const result = await scrapeV2EXPage(postId, page, startId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
