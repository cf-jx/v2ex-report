import { getStaticFAQ, getStaticReport } from "@/data/reports";
import type { V2EXReport, FAQCard } from "./types";

export async function getReportData(postId: string): Promise<V2EXReport | null> {
  return getStaticReport(postId);
}

export async function getFAQData(postId: string): Promise<FAQCard[]> {
  return getStaticFAQ(postId);
}
