import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { generateFullSummary } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import type { V2EXReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_ID = "1200385";

// On Vercel, /tmp is the only writable directory
function getSummaryPath(): string {
  return join("/tmp", `${POST_ID}-summary.json`);
}

function getReportPath(): string {
  return join(process.cwd(), "src", "data", "posts", `${POST_ID}.json`);
}

// Also check the bundled path (pre-generated summary shipped with the build)
function getBundledSummaryPath(): string {
  return join(process.cwd(), "src", "data", "posts", `${POST_ID}-summary.json`);
}

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
    const report = JSON.parse(readFileSync(getReportPath(), "utf-8")) as V2EXReport;

    const summary = await generateFullSummary(report.comments, report.meta.title);

    if (!summary) {
      return NextResponse.json(
        { error: "AI failed to generate summary" },
        { status: 500 },
      );
    }

    // Write to /tmp (writable on Vercel)
    const payload = { summary, generatedAt: new Date().toISOString() };
    writeFileSync(getSummaryPath(), JSON.stringify(payload, null, 2), "utf-8");

    revalidatePath("/");

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Try /tmp first (runtime-generated), then bundled (shipped with build)
    const tmpPath = getSummaryPath();
    const bundledPath = getBundledSummaryPath();

    const filePath = existsSync(tmpPath)
      ? tmpPath
      : existsSync(bundledPath)
        ? bundledPath
        : null;

    if (!filePath) {
      return NextResponse.json({ summary: null });
    }

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ summary: null });
  }
}
