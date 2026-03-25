import { NextResponse } from "next/server";
import { analyzeComments } from "@/lib/analyzer";
import { saveReport } from "@/lib/blob";
import { reportExists } from "@/lib/blob";
import type { RawPostData } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting: 1 per IP per min, 1 per postId per 30min
const ipLimitMap = new Map<string, number>();
const postLimitMap = new Map<string, number>();
const IP_WINDOW = 60 * 1000;
const POST_WINDOW = 30 * 60 * 1000;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const raw = body as RawPostData;

  if (!raw.postId || !raw.comments || !Array.isArray(raw.comments)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = Date.now();
  const ip = getClientIP(request);

  // Per-IP rate limit
  const lastIp = ipLimitMap.get(ip) || 0;
  if (now - lastIp < IP_WINDOW) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // Per-postId cooldown (skip if report doesn't exist yet)
  const lastPost = postLimitMap.get(raw.postId) || 0;
  if (now - lastPost < POST_WINDOW) {
    const exists = await reportExists(raw.postId);
    if (exists) {
      return NextResponse.json(
        { error: "Report was recently generated, please wait" },
        { status: 429 },
      );
    }
  }

  ipLimitMap.set(ip, now);
  postLimitMap.set(raw.postId, now);

  try {
    const report = analyzeComments(raw);
    await saveReport(raw.postId, report);
    return NextResponse.json({ success: true, postId: raw.postId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
