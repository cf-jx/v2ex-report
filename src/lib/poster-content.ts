import type { FAQCard, V2EXReport } from "@/lib/types";

export interface PosterStat {
  label: string;
  value: string;
}

export interface PosterTakeaway {
  title: string;
  body: string;
}

export interface PosterQuote {
  author: string;
  body: string;
}

export interface PosterTopic {
  name: string;
  count: number;
  color: string;
}

export interface PosterVoice {
  name: string;
  count: number;
  isOP: boolean;
}

export interface PosterContent {
  postId: string;
  title: string;
  author: string;
  url: string;
  lastUpdated: string;
  summary: string;
  stats: PosterStat[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topics: PosterTopic[];
  voices: PosterVoice[];
  takeaways: PosterTakeaway[];
  quotes: PosterQuote[];
}

function cleanText(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]*]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text: string, maxLength: number): string {
  const normalized = cleanText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function dominantSentiment(sentiment: PosterContent["sentiment"]): string {
  const pairs = [
    ["积极", sentiment.positive],
    ["中立", sentiment.neutral],
    ["消极", sentiment.negative],
  ] as const;

  return [...pairs].sort((a, b) => b[1] - a[1])[0][0];
}

export function buildPosterContent(
  report: V2EXReport,
  faqs: FAQCard[],
): PosterContent {
  const uniqueCommenters = new Set(report.comments.map((comment) => comment.author)).size;
  const { meta, analysis } = report;
  const leadTopics = analysis.topicDistribution.slice(0, 3).map((topic) => topic.name);
  const dominantMood = dominantSentiment(analysis.sentimentBreakdown);
  const summary = [
    `这篇讨论围绕 ${leadTopics.join("、")} 展开，共 ${meta.replyCount} 条回复，${uniqueCommenters} 位评论者参与。`,
    `整体情绪以${dominantMood}为主，楼主共回复 ${analysis.opStats.replyCount} 次，回应率 ${analysis.opStats.responseRate.toFixed(1)}%。`,
    `适合导出成一张“讨论快照”海报，用来展示核心议题、情绪走向和代表性观点。`,
  ].join("");

  const takeaways: PosterTakeaway[] = faqs.slice(0, 2).map((faq) => ({
    title: cleanText(faq.question),
    body: excerpt(faq.aiSummary || faq.opAnswer, 120),
  }));

  if (takeaways.length < 2) {
    const fallback = analysis.hotComments.slice(0, 2 - takeaways.length).map((comment) => ({
      title: `评论 #${comment.id} · ${comment.author}`,
      body: excerpt(comment.content, 120),
    }));
    takeaways.push(...fallback);
  }

  const quotes: PosterQuote[] = analysis.hotComments.slice(0, 2).map((comment) => ({
    author: comment.author,
    body: excerpt(comment.content, 150),
  }));

  return {
    postId: meta.postId,
    title: meta.title,
    author: meta.author,
    url: meta.url,
    lastUpdated: new Date(meta.lastFetched).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    summary,
    stats: [
      { label: "Replies", value: meta.replyCount.toLocaleString("zh-CN") },
      { label: "Commenters", value: uniqueCommenters.toLocaleString("zh-CN") },
      { label: "Views", value: meta.viewCount.toLocaleString("zh-CN") },
      { label: "OP Reply Rate", value: `${analysis.opStats.responseRate.toFixed(1)}%` },
    ],
    sentiment: analysis.sentimentBreakdown,
    topics: analysis.topicDistribution.slice(0, 5).map((topic) => ({
      name: topic.name,
      count: topic.count,
      color: topic.color,
    })),
    voices: analysis.topUsers.slice(0, 5).map((user) => ({
      name: user.name,
      count: user.count,
      isOP: user.isOP,
    })),
    takeaways,
    quotes,
  };
}
