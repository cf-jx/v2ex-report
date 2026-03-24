import type { V2EXReport, FAQCard } from "./types"

export async function getReportData(postId: string): Promise<V2EXReport> {
  const data = await import(`@/data/posts/${postId}.json`)
  return data.default as V2EXReport
}

export async function getFAQData(postId: string): Promise<FAQCard[]> {
  const data = await import(`@/data/posts/${postId}-faq.json`)
  return data.default as FAQCard[]
}
