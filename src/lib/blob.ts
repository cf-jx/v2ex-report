import { put, head } from "@vercel/blob";
import type { V2EXReport, FAQCard } from "./types";

function reportKey(postId: string) {
  return `reports/${postId}.json`;
}

function faqKey(postId: string) {
  return `reports/${postId}-faq.json`;
}

function summaryKey(postId: string) {
  return `reports/${postId}-summary.json`;
}

function likesKey(postId: string) {
  return `reports/${postId}-likes.json`;
}

// ── Write helpers ──

export async function saveReport(postId: string, data: V2EXReport) {
  await put(reportKey(postId), JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function saveFAQ(postId: string, data: FAQCard[]) {
  await put(faqKey(postId), JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function saveSummary(postId: string, data: string) {
  await put(summaryKey(postId), JSON.stringify({ summary: data }), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function saveLikes(
  postId: string,
  data: { count: number; ips: string[] },
) {
  await put(likesKey(postId), JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// ── Read helpers ──

async function loadBlob<T>(key: string): Promise<T | null> {
  try {
    const meta = await head(key);
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadReport(
  postId: string,
): Promise<V2EXReport | null> {
  return loadBlob<V2EXReport>(reportKey(postId));
}

export async function loadFAQ(postId: string): Promise<FAQCard[] | null> {
  return loadBlob<FAQCard[]>(faqKey(postId));
}

export async function loadSummary(postId: string): Promise<string | null> {
  const data = await loadBlob<{ summary: string }>(summaryKey(postId));
  return data?.summary ?? null;
}

export async function loadLikes(
  postId: string,
): Promise<{ count: number; ips: string[] } | null> {
  return loadBlob<{ count: number; ips: string[] }>(likesKey(postId));
}

// ── Existence check ──

export async function reportExists(postId: string): Promise<boolean> {
  try {
    await head(reportKey(postId));
    return true;
  } catch {
    return false;
  }
}
