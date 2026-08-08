import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeComments } from "../src/lib/analyzer";
import { scrapeV2EXPost } from "../src/lib/scraper";

const DEFAULT_POST_IDS = ["1200385"];
const requestedPostIds = process.argv
  .slice(2)
  .filter((value) => /^\d{1,12}$/.test(value));
const postIds = requestedPostIds.length > 0 ? requestedPostIds : DEFAULT_POST_IDS;

async function main() {
  for (const postId of postIds) {
    const rawReport = await scrapeV2EXPost(postId);
    const report = analyzeComments(rawReport);
    const outputPath = resolve("src", "data", "posts", `${postId}.json`);

    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Updated report ${postId}: ${report.comments.length} comments`);
  }
}

main().catch((error: unknown) => {
  console.error("Report refresh failed:", error);
  process.exitCode = 1;
});
