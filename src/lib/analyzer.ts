import type { RawPostData, RawComment } from "./scraper";
import type { V2EXReport, Comment, Analysis, UserStat, TopicStat } from "./types";

const TOPIC_RULES: { pattern: RegExp; name: string }[] = [
  { pattern: /封号|风控|ban|封了|被封/i, name: "封号风控" },
  { pattern: /google\s*play|谷歌|gp内购|google.*内购/i, name: "Google Play" },
  { pattern: /vpn|节点|梯子|ip|代理|机场|落地/i, name: "VPN/节点" },
  { pattern: /礼品卡|gift\s*card|apple|苹果|app\s*store/i, name: "苹果礼品卡" },
  { pattern: /visa|信用卡|银行卡|万事达|mastercard/i, name: "Visa/信用卡" },
  { pattern: /中转|relay|api代理|api\s*代/i, name: "中转站" },
  { pattern: /pro|额度|quota|max|订阅/i, name: "Pro额度" },
  { pattern: /储蓄卡|借记卡|银联|debit/i, name: "储蓄卡方案" },
];

const TOPIC_ICONS: Record<string, string> = {
  "封号风控": "\uD83D\uDEAB",
  "Google Play": "\uD83D\uDED2",
  "VPN/节点": "\uD83C\uDF10",
  "苹果礼品卡": "\uD83C\uDF4E",
  "Visa/信用卡": "\uD83D\uDCB3",
  "中转站": "\uD83D\uDD04",
  "Pro额度": "\uD83D\uDCCA",
  "储蓄卡方案": "\uD83D\uDCB0",
  "其他讨论": "\uD83D\uDCAC",
};

const TOPIC_COLORS = [
  "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51",
  "#6d6875", "#b5838d", "#e5989b", "#ffb4a2",
];

const POSITIVE_WORDS = /支持|不错|感谢|谢谢|好|赞|厉害|学到|有用|牛|优秀|nice|great|棒|收藏|mark/i;
const NEGATIVE_WORDS = /坑|垃圾|差|封|被封|问题|麻烦|风险|割韭菜|骗|坑人|sb|辣鸡/i;

function classifyTopics(content: string): string[] {
  const topics: string[] = [];
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(content)) {
      topics.push(rule.name);
    }
  }
  return topics.length > 0 ? topics : ["其他讨论"];
}

function classifySentiment(content: string): "positive" | "neutral" | "negative" {
  const hasPositive = POSITIVE_WORDS.test(content);
  const hasNegative = NEGATIVE_WORDS.test(content);
  if (hasPositive && !hasNegative) return "positive";
  if (hasNegative && !hasPositive) return "negative";
  return "neutral";
}

function enrichComment(raw: RawComment, opAuthor: string): Comment {
  return {
    id: raw.id,
    author: raw.author,
    content: raw.content,
    replyTo: raw.replyTo,
    likes: 0,
    isOP: raw.author === opAuthor,
    topics: classifyTopics(raw.content),
    sentiment: classifySentiment(raw.content),
  };
}

export function analyzeComments(raw: RawPostData): V2EXReport {
  const opAuthor = raw.author;
  const comments = raw.comments.map((c) => enrichComment(c, opAuthor));

  // Top users
  const userCounts = new Map<string, number>();
  for (const c of comments) {
    userCounts.set(c.author, (userCounts.get(c.author) ?? 0) + 1);
  }
  const topUsers: UserStat[] = Array.from(userCounts.entries())
    .map(([name, count]) => ({ name, count, isOP: name === opAuthor }))
    .sort((a, b) => b.count - a.count);

  // Topic distribution
  const topicCounts = new Map<string, number>();
  for (const c of comments) {
    for (const t of c.topics) {
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }
  const topicDistribution: TopicStat[] = Array.from(topicCounts.entries())
    .map(([name, count], i) => ({
      name,
      count,
      icon: TOPIC_ICONS[name] ?? "\uD83D\uDCAC",
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);

  // Sentiment breakdown
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const c of comments) {
    sentimentBreakdown[c.sentiment]++;
  }

  // Hot comments: longest substantive comments from diverse authors
  const seen = new Set<string>();
  const hotComments = comments
    .filter((c) => c.content.length > 50 && !c.isOP)
    .sort((a, b) => b.content.length - a.content.length)
    .filter((c) => {
      if (seen.has(c.author)) return false;
      seen.add(c.author);
      return true;
    })
    .slice(0, 8);

  // OP stats
  const nonOpComments = comments.filter((c) => !c.isOP);
  const opReplies = comments.filter((c) => c.isOP && c.replyTo);
  const responseRate =
    nonOpComments.length > 0
      ? (opReplies.length / nonOpComments.length) * 100
      : 0;

  const analysis: Analysis = {
    topUsers,
    topicDistribution,
    sentimentBreakdown,
    hotComments,
    opStats: {
      replyCount: comments.filter((c) => c.isOP).length,
      responseRate: Math.round(responseRate * 10) / 10,
      avgResponseTime: "~2h",
    },
  };

  return {
    meta: {
      postId: raw.postId,
      title: raw.title,
      author: raw.author,
      url: raw.url,
      viewCount: raw.viewCount,
      favoriteCount: raw.favoriteCount,
      replyCount: raw.replyCount,
      lastFetched: new Date().toISOString(),
      totalPages: raw.totalPages,
    },
    comments,
    analysis,
  };
}
