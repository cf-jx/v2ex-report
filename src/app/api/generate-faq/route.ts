import { NextResponse } from "next/server";
import { generateAllFAQs } from "@/lib/ai";
import { getReportData } from "@/lib/data";
import { saveFAQ } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
let lastGlobalCall = 0;
const GLOBAL_COOLDOWN = 3 * 60 * 1000;
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
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const postId = body.postId || "1200385";

  const now = Date.now();
  const ip = getClientIP(request);

  if (now - hourlyReset > 60 * 60 * 1000) {
    hourlyCount = 0;
    hourlyReset = now;
  }

  if (hourlyCount >= MAX_HOURLY) {
    const retryAfter = Math.ceil((hourlyReset + 60 * 60 * 1000 - now) / 1000);
    return NextResponse.json({ error: "Hourly limit reached", retryAfter }, { status: 429 });
  }

  if (now - lastGlobalCall < GLOBAL_COOLDOWN) {
    const retryAfter = Math.ceil((lastGlobalCall + GLOBAL_COOLDOWN - now) / 1000);
    return NextResponse.json({ error: "Please wait", retryAfter }, { status: 429 });
  }

  const lastCall = rateLimitMap.get(ip) || 0;
  if (now - lastCall < RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((lastCall + RATE_LIMIT_WINDOW - now) / 1000);
    return NextResponse.json({ error: "Rate limited", retryAfter }, { status: 429 });
  }

  rateLimitMap.set(ip, now);
  lastGlobalCall = now;
  hourlyCount++;

  for (const [key, timestamp] of rateLimitMap) {
    if (now - timestamp > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
  }

  try {
    const report = await getReportData(postId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const faqs = await generateAllFAQs(report.comments, report.meta.title);
    if (faqs.length === 0) {
      return NextResponse.json({ error: "AI failed to generate FAQs" }, { status: 500 });
    }

    await saveFAQ(postId, faqs);
    revalidatePath(`/t/${postId}`);

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
