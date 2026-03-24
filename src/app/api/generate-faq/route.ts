import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateAllFAQs } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import type { V2EXReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_ID = "1200385";

// Simple in-memory rate limiter: 1 request per IP per 10 minutes
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
// Global cooldown: only 1 generation at a time, max 5 per hour
let lastGlobalCall = 0;
const GLOBAL_COOLDOWN = 3 * 60 * 1000; // 3 minutes between any calls
let hourlyCount = 0;
let hourlyReset = Date.now();
const MAX_HOURLY = 5;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  // Check if AI API is configured
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 },
    );
  }

  const now = Date.now();
  const ip = getClientIP(request);

  // Reset hourly counter
  if (now - hourlyReset > 60 * 60 * 1000) {
    hourlyCount = 0;
    hourlyReset = now;
  }

  // Check hourly global limit
  if (hourlyCount >= MAX_HOURLY) {
    const retryAfter = Math.ceil((hourlyReset + 60 * 60 * 1000 - now) / 1000);
    return NextResponse.json(
      { error: "Hourly limit reached, please try later", retryAfter },
      { status: 429 },
    );
  }

  // Check global cooldown
  if (now - lastGlobalCall < GLOBAL_COOLDOWN) {
    const retryAfter = Math.ceil((lastGlobalCall + GLOBAL_COOLDOWN - now) / 1000);
    return NextResponse.json(
      { error: "Someone just triggered generation, please wait", retryAfter },
      { status: 429 },
    );
  }

  // Check per-IP rate limit
  const lastCall = rateLimitMap.get(ip) || 0;
  if (now - lastCall < RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((lastCall + RATE_LIMIT_WINDOW - now) / 1000);
    return NextResponse.json(
      { error: "Rate limited, please try later", retryAfter },
      { status: 429 },
    );
  }

  // Update rate limit state
  rateLimitMap.set(ip, now);
  lastGlobalCall = now;
  hourlyCount++;

  // Clean up old entries
  for (const [key, timestamp] of rateLimitMap) {
    if (now - timestamp > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
  }

  try {
    // Load current report data
    const dataDir = join(process.cwd(), "src", "data", "posts");
    const reportPath = join(dataDir, `${POST_ID}.json`);
    const report = JSON.parse(readFileSync(reportPath, "utf-8")) as V2EXReport;

    // Generate FAQ with AI
    const faqs = await generateAllFAQs(report.comments, report.meta.title);

    if (faqs.length === 0) {
      return NextResponse.json(
        { error: "AI failed to generate FAQs" },
        { status: 500 },
      );
    }

    // Save
    const faqPath = join(dataDir, `${POST_ID}-faq.json`);
    writeFileSync(faqPath, JSON.stringify(faqs, null, 2), "utf-8");

    // Revalidate page
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      faqCount: faqs.length,
      questions: faqs.map((f) => f.question),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
