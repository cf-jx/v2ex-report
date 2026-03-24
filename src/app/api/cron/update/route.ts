import { NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";
import { scrapeV2EXPost } from "@/lib/scraper";
import { analyzeComments } from "@/lib/analyzer";
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

    // Write to data file
    const dataPath = join(process.cwd(), "src", "data", "posts", `${POST_ID}.json`);
    writeFileSync(dataPath, JSON.stringify(report, null, 2), "utf-8");

    // Trigger ISR revalidation
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      commentsCount: report.comments.length,
      lastFetched: report.meta.lastFetched,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
