import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateAllFAQs } from "../src/lib/ai";
import type { V2EXReport } from "../src/lib/types";

const POST_ID = process.argv[2] || "1200385";

async function main() {
  const dataPath = join(__dirname, "..", "src", "data", "posts", `${POST_ID}.json`);
  const report = JSON.parse(readFileSync(dataPath, "utf-8")) as V2EXReport;

  console.log(`Generating AI FAQ for post ${POST_ID} (${report.comments.length} comments)...`);

  const faqs = await generateAllFAQs(report.comments, report.meta.title);

  const outPath = join(__dirname, "..", "src", "data", "posts", `${POST_ID}-faq.json`);
  writeFileSync(outPath, JSON.stringify(faqs, null, 2), "utf-8");

  console.log(`\nGenerated ${faqs.length} FAQ cards:`);
  for (const faq of faqs) {
    console.log(`  Q: ${faq.question} (${faq.frequency} related comments)`);
  }
  console.log(`\nWritten to ${outPath}`);
}

main().catch((err) => {
  console.error("FAQ generation failed:", err);
  process.exit(1);
});
