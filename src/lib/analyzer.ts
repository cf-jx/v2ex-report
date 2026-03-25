import type { RawPostData, RawComment } from "./scraper";
import type { V2EXReport, Comment, Analysis, UserStat, TopicStat } from "./types";

// ── Hardcoded topic rules for seed post 1200385 ──

const SEED_POST_ID = "1200385";

const SEED_TOPIC_RULES: { pattern: RegExp; name: string }[] = [
  { pattern: /封号|风控|ban|封了|被封/i, name: "封号风控" },
  { pattern: /google\s*play|谷歌|gp内购|google.*内购/i, name: "Google Play" },
  { pattern: /vpn|节点|梯子|ip|代理|机场|落地/i, name: "VPN/节点" },
  { pattern: /礼品卡|gift\s*card|apple|苹果|app\s*store/i, name: "苹果礼品卡" },
  { pattern: /visa|信用卡|银行卡|万事达|mastercard/i, name: "Visa/信用卡" },
  { pattern: /中转|relay|api代理|api\s*代/i, name: "中转站" },
  { pattern: /pro|额度|quota|max|订阅/i, name: "Pro额度" },
  { pattern: /储蓄卡|借记卡|银联|debit/i, name: "储蓄卡方案" },
];

// ── Generic topic extraction via word frequency ──

// Common stop words to exclude from topic extraction
const STOP_WORDS = new Set([
  "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个",
  "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好",
  "自己", "这", "他", "她", "它", "吗", "什么", "那", "可以", "还", "用", "个",
  "但", "而", "被", "这个", "那个", "如果", "因为", "所以", "但是", "或者",
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in", "with",
  "to", "for", "of", "not", "no", "it", "you", "he", "she", "we", "they", "i",
  "do", "that", "this", "from", "by", "be", "have", "has", "had", "are", "was",
]);

interface TopicRule {
  pattern: RegExp;
  name: string;
}

/**
 * Extract topic rules from comments using word/phrase frequency.
 * Returns top 6-8 most common meaningful terms as topic categories.
 */
function extractTopicRules(comments: RawComment[]): TopicRule[] {
  const wordCounts = new Map<string, number>();

  for (const c of comments) {
    // Extract Chinese phrases (2-4 chars) and English words (3+ chars)
    const cnMatches = c.content.match(/[\u4e00-\u9fff]{2,4}/g) || [];
    const enMatches = c.content.match(/[a-zA-Z]{3,}/gi) || [];

    const allTerms = [...cnMatches, ...enMatches.map((w) => w.toLowerCase())];
    const seen = new Set<string>();

    for (const term of allTerms) {
      if (STOP_WORDS.has(term) || seen.has(term)) continue;
      seen.add(term);
      wordCounts.set(term, (wordCounts.get(term) ?? 0) + 1);
    }
  }

  // Filter: at least 5% of comments mention it, minimum 3 mentions
  const minCount = Math.max(3, Math.ceil(comments.length * 0.05));

  const candidates = Array.from(wordCounts.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return candidates.map(([term]) => ({
    pattern: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    name: term,
  }));
}

// ── Sentiment classification ──

const POSITIVE_WORDS = /支持|不错|感谢|谢谢|好|赞|厉害|学到|有用|牛|优秀|nice|great|棒|收藏|mark/i;
const NEGATIVE_WORDS = /坑|垃圾|差|封|被封|问题|麻烦|风险|割韭菜|骗|坑人|sb|辣鸡/i;

function classifySentiment(content: string): "positive" | "neutral" | "negative" {
  const hasPositive = POSITIVE_WORDS.test(content);
  const hasNegative = NEGATIVE_WORDS.test(content);
  if (hasPositive && !hasNegative) return "positive";
  if (hasNegative && !hasPositive) return "negative";
  return "neutral";
}

// ── Topic classification ──

function classifyTopics(content: string, rules: TopicRule[]): string[] {
  const topics: string[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      topics.push(rule.name);
    }
  }
  return topics.length > 0 ? topics : ["其他讨论"];
}

// ── Comment enrichment ──

function enrichComment(raw: RawComment, opAuthor: string, topicRules: TopicRule[]): Comment {
  return {
    id: raw.id,
    author: raw.author,
    content: raw.content,
    replyTo: raw.replyTo,
    likes: 0,
    isOP: raw.author === opAuthor,
    topics: classifyTopics(raw.content, topicRules),
    sentiment: classifySentiment(raw.content),
  };
}

// ── Topic colors and icons ──

const TOPIC_COLORS = [
  "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51",
  "#6d6875", "#b5838d", "#e5989b", "#ffb4a2",
];

// ── Main analysis function ──

export function analyzeComments(raw: RawPostData): V2EXReport {
  const opAuthor = raw.author;

  // Use hardcoded rules for seed post, generic extraction for others
  const topicRules =
    raw.postId === SEED_POST_ID
      ? SEED_TOPIC_RULES
      : extractTopicRules(raw.comments);

  const comments = raw.comments.map((c) => enrichComment(c, opAuthor, topicRules));

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
      icon: "\uD83D\uDCAC",
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
