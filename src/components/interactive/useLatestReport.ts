"use client";

import { useEffect, useState } from "react";
import type { Comment, V2EXReport } from "@/lib/types";

const REMOTE_REPORT_BASE =
  "https://raw.githubusercontent.com/cf-jx/v2ex-report/master/src/data/posts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isComment(value: unknown): value is Comment {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    typeof value.author === "string" &&
    typeof value.content === "string" &&
    (value.replyTo === null || typeof value.replyTo === "string") &&
    typeof value.isOP === "boolean" &&
    Array.isArray(value.topics) &&
    value.topics.every((topic) => typeof topic === "string") &&
    ["positive", "neutral", "negative"].includes(String(value.sentiment))
  );
}

function isUserStat(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.count === "number" &&
    typeof value.isOP === "boolean"
  );
}

function isTopicStat(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.count === "number" &&
    typeof value.icon === "string" &&
    typeof value.color === "string"
  );
}

function isReport(value: unknown, postId: string): value is V2EXReport {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.analysis)) {
    return false;
  }

  const { meta, analysis } = value;
  if (!Array.isArray(value.comments) || !value.comments.every(isComment)) return false;
  if (!isRecord(analysis.sentimentBreakdown) || !isRecord(analysis.opStats)) {
    return false;
  }

  const hasValidMeta =
    meta.postId === postId &&
    typeof meta.title === "string" &&
    typeof meta.author === "string" &&
    typeof meta.url === "string" &&
    typeof meta.viewCount === "number" &&
    typeof meta.replyCount === "number" &&
    meta.replyCount === value.comments.length &&
    typeof meta.totalPages === "number" &&
    typeof meta.lastFetched === "string" &&
    Number.isFinite(Date.parse(meta.lastFetched));

  const hasValidAnalysis =
    Array.isArray(analysis.topUsers) &&
    analysis.topUsers.every(isUserStat) &&
    Array.isArray(analysis.topicDistribution) &&
    analysis.topicDistribution.every(isTopicStat) &&
    Array.isArray(analysis.hotComments) &&
    analysis.hotComments.every(isComment) &&
    typeof analysis.sentimentBreakdown.positive === "number" &&
    typeof analysis.sentimentBreakdown.neutral === "number" &&
    typeof analysis.sentimentBreakdown.negative === "number" &&
    typeof analysis.opStats.replyCount === "number" &&
    typeof analysis.opStats.responseRate === "number" &&
    typeof analysis.opStats.avgResponseTime === "string";

  return hasValidMeta && hasValidAnalysis;
}

export function useLatestReport(report: V2EXReport, postId: string) {
  const [latestReport, setLatestReport] = useState(report);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatestReport() {
      try {
        const response = await fetch(`${REMOTE_REPORT_BASE}/${postId}.json`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;

        const candidate: unknown = await response.json();
        if (!isReport(candidate, postId)) return;

        setLatestReport((current) =>
          Date.parse(candidate.meta.lastFetched) > Date.parse(current.meta.lastFetched)
            ? candidate
            : current,
        );
      } catch {
        // Keep the bundled report when the optional freshness check is unavailable.
      }
    }

    void loadLatestReport();
    return () => controller.abort();
  }, [postId]);

  return latestReport;
}
