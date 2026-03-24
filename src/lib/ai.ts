import type { Comment, FAQCard } from "./types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.DOUBAO_API_KEY;
  const baseUrl = process.env.DOUBAO_BASE_URL;
  const model = process.env.DOUBAO_MODEL || "ark-code-latest";

  if (!apiKey || !baseUrl) {
    throw new Error("Missing DOUBAO_API_KEY or DOUBAO_BASE_URL env vars");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Doubao API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as ChatResponse;
  return data.choices[0]?.message?.content ?? "";
}

export interface FAQInput {
  question: string;
  frequency: number;
  relatedCommentIds: number[];
}

/**
 * Extract FAQ topics from comments using AI
 */
export async function extractFAQTopics(
  comments: Comment[],
  postTitle: string,
): Promise<FAQInput[]> {
  const commentTexts = comments
    .map((c) => `#${c.id} [${c.author}${c.isOP ? " OP" : ""}]: ${c.content}`)
    .join("\n");

  const response = await chatCompletion([
    {
      role: "system",
      content: `You are a data analyst. Analyze V2EX forum comments and extract the top 8 most frequently discussed questions/topics.
Output STRICT JSON array, no markdown, no explanation. Each item:
{"question": "问题标题（中文）", "frequency": <related_comment_count>, "relatedCommentIds": [<comment_ids>]}`,
    },
    {
      role: "user",
      content: `帖子标题: ${postTitle}\n\n全部评论:\n${commentTexts}\n\n请提取8个最高频的问题/话题，返回JSON数组。`,
    },
  ]);

  try {
    const cleaned = response.replace(/```json?\s*|\s*```/g, "").trim();
    return JSON.parse(cleaned) as FAQInput[];
  } catch {
    console.error("Failed to parse FAQ topics:", response);
    return [];
  }
}

/**
 * Generate AI summary for a single FAQ
 */
export async function generateFAQSummary(
  question: string,
  opAnswers: string[],
  relatedComments: string[],
): Promise<{ opAnswer: string; aiSummary: string }> {
  const response = await chatCompletion([
    {
      role: "system",
      content: `你是一个技术社区内容分析师。根据提供的评论数据，生成FAQ卡片内容。
要求：
1. opAnswer: 从OP的回复中提炼最核心的原话，保持原文口吻，100-200字
2. aiSummary: 你的专业解读和总结，给出实用建议，80-150字，用简洁的要点式表达

输出严格JSON格式，不要markdown：
{"opAnswer": "...", "aiSummary": "..."}`,
    },
    {
      role: "user",
      content: `问题: ${question}\n\nOP相关回复:\n${opAnswers.join("\n")}\n\n其他用户评论:\n${relatedComments.join("\n")}`,
    },
  ]);

  try {
    const cleaned = response.replace(/```json?\s*|\s*```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse FAQ summary:", response);
    return {
      opAnswer: opAnswers[0] || "暂无OP回复",
      aiSummary: "AI 解读生成失败，请查看原始评论。",
    };
  }
}

/**
 * Full pipeline: extract topics + generate summaries for all FAQs
 */
export async function generateAllFAQs(
  comments: Comment[],
  postTitle: string,
): Promise<FAQCard[]> {
  // Step 1: Extract FAQ topics
  const topics = await extractFAQTopics(comments, postTitle);

  if (topics.length === 0) {
    console.warn("No FAQ topics extracted, returning empty array");
    return [];
  }

  // Step 2: Generate summaries for each topic
  const faqs: FAQCard[] = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const relatedIds = new Set(topic.relatedCommentIds || []);

    // Gather OP answers and related comments
    const opAnswers = comments
      .filter((c) => c.isOP && relatedIds.has(c.id))
      .map((c) => c.content);

    const relatedComments = comments
      .filter((c) => !c.isOP && relatedIds.has(c.id))
      .map((c) => `${c.author}: ${c.content}`);

    // If no OP answers found in related, search by keyword
    if (opAnswers.length === 0) {
      const keywords = topic.question.split(/[？?，,\s]+/).filter((w) => w.length > 1);
      const fallback = comments
        .filter((c) => c.isOP && keywords.some((k) => c.content.includes(k)))
        .map((c) => c.content);
      opAnswers.push(...fallback.slice(0, 3));
    }

    const summary = await generateFAQSummary(
      topic.question,
      opAnswers,
      relatedComments,
    );

    faqs.push({
      id: `faq-${i + 1}`,
      question: topic.question,
      opAnswer: summary.opAnswer,
      aiSummary: summary.aiSummary,
      relatedCommentIds: Array.from(relatedIds),
      frequency: topic.frequency,
    });

    console.log(`Generated FAQ ${i + 1}/${topics.length}: ${topic.question}`);
  }

  return faqs;
}
