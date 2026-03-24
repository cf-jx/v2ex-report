import { NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";
import { scrapeV2EXPost } from "@/lib/scraper";
import { analyzeComments } from "@/lib/analyzer";
import { generateAllFAQs } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_ID = "1200385";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Scrape latest data
    const raw = await scrapeV2EXPost(POST_ID);

    // Analyze
    const report = analyzeComments(raw);

    // Write report data to /tmp (Vercel filesystem is read-only)
    const dataPath = join("/tmp", `${POST_ID}.json`);
    writeFileSync(dataPath, JSON.stringify(report, null, 2), "utf-8");

    // Generate AI FAQ summaries (if AI API is configured)
    let faqCount = 0;
    if (process.env.AI_API_KEY && process.env.AI_BASE_URL) {
      try {
        const faqs = await generateAllFAQs(report.comments, report.meta.title);
        if (faqs.length > 0) {
          const faqPath = join("/tmp", `${POST_ID}-faq.json`);
          writeFileSync(faqPath, JSON.stringify(faqs, null, 2), "utf-8");
          faqCount = faqs.length;
        }
      } catch (aiError) {
        console.error("AI FAQ generation failed:", aiError);
        // Non-fatal: keep existing FAQ data
      }
    }

    // Trigger ISR revalidation
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      commentsCount: report.comments.length,
      faqCount,
      lastFetched: report.meta.lastFetched,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
