import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { scrapeV2EXPost } from "../src/lib/scraper";
import { analyzeComments } from "../src/lib/analyzer";

const POST_ID = process.argv[2] || "1200385";

async function main() {
  console.log(`Scraping V2EX post ${POST_ID}...`);
  const raw = await scrapeV2EXPost(POST_ID);
  console.log(`Fetched ${raw.comments.length} comments`);

  console.log("Analyzing...");
  const report = analyzeComments(raw);

  const outDir = join(__dirname, "..", "src", "data", "posts");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, `${POST_ID}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Written to ${outPath}`);

  console.log(`Topics: ${report.analysis.topicDistribution.map((t) => `${t.name}(${t.count})`).join(", ")}`);
  console.log(`Sentiment: +${report.analysis.sentimentBreakdown.positive} =${report.analysis.sentimentBreakdown.neutral} -${report.analysis.sentimentBreakdown.negative}`);
  console.log(`Top users: ${report.analysis.topUsers.slice(0, 5).map((u) => `${u.name}(${u.count})`).join(", ")}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
