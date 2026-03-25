import { NextResponse } from "next/server";
import { scrapeV2EXPost } from "@/lib/scraper";
import { analyzeComments } from "@/lib/analyzer";
import { generateAllFAQs } from "@/lib/ai";
import { saveReport, saveFAQ } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_ID = "1200385";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await scrapeV2EXPost(POST_ID);
    const report = analyzeComments(raw);

    await saveReport(POST_ID, report);

    let faqCount = 0;
    if (process.env.AI_API_KEY && process.env.AI_BASE_URL) {
      try {
        const faqs = await generateAllFAQs(report.comments, report.meta.title);
        if (faqs.length > 0) {
          await saveFAQ(POST_ID, faqs);
          faqCount = faqs.length;
        }
      } catch (aiError) {
        console.error("AI FAQ generation failed:", aiError);
      }
    }

    revalidatePath("/");
    revalidatePath(`/t/${POST_ID}`);

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
