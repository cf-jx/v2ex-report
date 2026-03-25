import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { loadReport as loadReportFromBlob, loadFAQ as loadFAQFromBlob } from "./blob";
import type { V2EXReport, FAQCard } from "./types";

/**
 * Load report data: try Vercel Blob first, then bundled fallback.
 */
export async function getReportData(postId: string): Promise<V2EXReport | null> {
  // Try Blob storage (works on Vercel)
  try {
    const blob = await loadReportFromBlob(postId);
    if (blob) return blob;
  } catch {
    // Blob not configured or failed — fall through to bundled
  }

  // Fallback: bundled static file (only exists for seed posts)
  const bundled = join(
    /*turbopackIgnore: true*/ process.cwd(),
    `src/data/posts/${postId}.json`,
  );
  if (existsSync(bundled)) {
    return JSON.parse(readFileSync(bundled, "utf-8")) as V2EXReport;
  }

  return null;
}

/**
 * Load FAQ data: try Vercel Blob first, then bundled fallback.
 */
export async function getFAQData(postId: string): Promise<FAQCard[]> {
  try {
    const blob = await loadFAQFromBlob(postId);
    if (blob) return blob;
  } catch {
    // fall through
  }

  const bundled = join(
    /*turbopackIgnore: true*/ process.cwd(),
    `src/data/posts/${postId}-faq.json`,
  );
  if (existsSync(bundled)) {
    return JSON.parse(readFileSync(bundled, "utf-8")) as FAQCard[];
  }

  return [];
}
