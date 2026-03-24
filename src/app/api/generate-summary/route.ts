import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { generateFullSummary } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import type { V2EXReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_ID = "1200385";

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
      { error: "AI service not configured", code: "NO_AI_CONFIG" },
      { status: 503 },
    );
  }

  const now = Date.now();
  const ip = getClientIP(request);

  // Global cooldown
  if (now - lastGlobalCall < GLOBAL_COOLDOWN) {
    const retryAfter = Math.ceil((lastGlobalCall + GLOBAL_COOLDOWN - now) / 1000);
    return NextResponse.json(
      { error: "Someone just triggered generation, please wait", retryAfter },
      { status: 429 },
    );
  }

  // Per-IP rate limit
  const lastCall = rateLimitMap.get(ip) || 0;
  if (now - lastCall < RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((lastCall + RATE_LIMIT_WINDOW - now) / 1000);
    return NextResponse.json(
      { error: "Rate limited, please try later", retryAfter },
      { status: 429 },
    );
  }

  rateLimitMap.set(ip, now);
  lastGlobalCall = now;

  // Clean up old entries
  for (const [key, timestamp] of rateLimitMap) {
    if (now - timestamp > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
  }

  try {
    const dataDir = join(process.cwd(), "src", "data", "posts");
    const reportPath = join(dataDir, `${POST_ID}.json`);
    const report = JSON.parse(readFileSync(reportPath, "utf-8")) as V2EXReport;

    const summary = await generateFullSummary(report.comments, report.meta.title);

    if (!summary) {
      return NextResponse.json(
        { error: "AI failed to generate summary" },
        { status: 500 },
      );
    }

    // Persist summary
    const summaryPath = join(dataDir, `${POST_ID}-summary.json`);
    writeFileSync(
      summaryPath,
      JSON.stringify({ summary, generatedAt: new Date().toISOString() }, null, 2),
      "utf-8",
    );

    revalidatePath("/");

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "src", "data", "posts");
    const summaryPath = join(dataDir, `${POST_ID}-summary.json`);

    if (!existsSync(summaryPath)) {
      return NextResponse.json({ summary: null });
    }

    const data = JSON.parse(readFileSync(summaryPath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ summary: null });
  }
}
