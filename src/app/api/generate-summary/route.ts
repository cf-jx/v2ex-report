import { NextResponse } from "next/server";
import { generateFullSummary } from "@/lib/ai";
import { getReportData } from "@/lib/data";
import { saveSummary, loadSummary } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting: 1 per IP per 10 min, global cooldown 3 min
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
let lastGlobalCall = 0;
const GLOBAL_COOLDOWN = 3 * 60 * 1000;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    return NextResponse.json(
      { error: "AI 服务未配置，暂时无法生成总结", code: "NO_AI_CONFIG" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const postId = body.postId || "1200385";

  const now = Date.now();
  const ip = getClientIP(request);

  if (now - lastGlobalCall < GLOBAL_COOLDOWN) {
    const retryAfter = Math.ceil((lastGlobalCall + GLOBAL_COOLDOWN - now) / 1000);
    return NextResponse.json({ error: "Someone just triggered generation, please wait", retryAfter }, { status: 429 });
  }

  const lastCall = rateLimitMap.get(ip) || 0;
  if (now - lastCall < RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((lastCall + RATE_LIMIT_WINDOW - now) / 1000);
    return NextResponse.json({ error: "Rate limited, please try later", retryAfter }, { status: 429 });
  }

  rateLimitMap.set(ip, now);
  lastGlobalCall = now;

  for (const [key, timestamp] of rateLimitMap) {
    if (now - timestamp > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
  }

  try {
    const report = await getReportData(postId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const summary = await generateFullSummary(report.comments, report.meta.title);
    if (!summary) {
      return NextResponse.json({ error: "AI failed to generate summary" }, { status: 500 });
    }

    await saveSummary(postId, summary);
    revalidatePath(`/t/${postId}`);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId") || "1200385";

  try {
    const summary = await loadSummary(postId);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
