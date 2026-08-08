import defaultFAQ from "./posts/1200385-faq.json";
import defaultReport from "./posts/1200385.json";
import type { FAQCard, V2EXReport } from "@/lib/types";

const reports: Record<string, V2EXReport> = {
  "1200385": defaultReport as V2EXReport,
};

const faqs: Record<string, FAQCard[]> = {
  "1200385": defaultFAQ as FAQCard[],
};

export const staticPostIds = Object.freeze(Object.keys(reports));

export function getStaticReport(postId: string): V2EXReport | null {
  return reports[postId] ?? null;
}

export function getStaticFAQ(postId: string): FAQCard[] {
  return faqs[postId] ?? [];
}
