export interface RawComment {
  id: number;
  author: string;
  content: string;
  replyTo: string | null;
}

export interface RawPostData {
  postId: string;
  title: string;
  author: string;
  url: string;
  viewCount: number;
  replyCount: number;
  totalPages: number;
  comments: RawComment[];
}

interface V2EXTopic {
  id: number;
  title: string;
  url: string;
  replies: number;
  deleted?: number;
  member: { username: string } | null;
}

interface V2EXReply {
  id: number;
  topic_id: number;
  content: string;
  member: { username: string } | null;
}

const V2EX_ORIGIN = "https://www.v2ex.com";
const MAX_REPLIES = 1_000;

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "User-Agent": "V2EX-Report/1.0 (+https://github.com/cf-jx/v2ex-report)",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.warn("V2EX API request rejected", {
      path: new URL(url).pathname,
      status: response.status,
      response: responseText.slice(0, 300),
    });
    const diagnostic = responseText
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    throw new Error(
      `V2EX API request failed with status ${response.status}${diagnostic ? `: ${diagnostic}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

async function fetchViewCount(postId: string, cacheBucket: number): Promise<number> {
  const response = await fetch(
    `${V2EX_ORIGIN}/t/${postId}?v2ex_report_cache=${cacheBucket}`,
    {
      headers: {
        Accept: "text/html",
        "Cache-Control": "no-cache",
        "User-Agent": "V2EX-Report/1.0 (+https://github.com/cf-jx/v2ex-report)",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`V2EX post page request failed with status ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/([\d,]+)\s+views<\/small>/i);
  if (!match) throw new Error("V2EX view count was not found in the post page");

  return Number.parseInt(match[1].replaceAll(",", ""), 10);
}

function normalizeReply(reply: V2EXReply, index: number): RawComment {
  const rawContent = typeof reply.content === "string" ? reply.content.trim() : "";
  const mention = rawContent.match(/^@([A-Za-z0-9_]+)(?:\s+#\d+)?(?:\s+|$)/);
  const content = mention ? rawContent.slice(mention[0].length).trim() : rawContent;

  return {
    id: index + 1,
    author: reply.member?.username || "deleted",
    content: content || "(deleted)",
    replyTo: mention?.[1] ?? null,
  };
}

/** Fetch a complete post through V2EX's public JSON API. */
export async function scrapeV2EXPost(postId: string): Promise<RawPostData> {
  const cacheBucket = Math.floor(Date.now() / 60_000);
  const topicUrl = `${V2EX_ORIGIN}/api/topics/show.json?id=${postId}&v2ex_report_cache=${cacheBucket}`;
  const repliesUrl = `${V2EX_ORIGIN}/api/replies/show.json?topic_id=${postId}&v2ex_report_cache=${cacheBucket}`;

  const [topics, replies, viewCount] = await Promise.all([
    fetchJSON<V2EXTopic[]>(topicUrl),
    fetchJSON<V2EXReply[]>(repliesUrl),
    fetchViewCount(postId, cacheBucket),
  ]);

  const topic = topics[0];
  if (!topic || topic.deleted || String(topic.id) !== postId || !topic.member) {
    throw new Error("V2EX post was not found or has been deleted");
  }
  if (!Array.isArray(replies)) {
    throw new Error("V2EX replies response is invalid");
  }
  if (topic.replies > MAX_REPLIES) {
    throw new Error(`Posts with more than ${MAX_REPLIES} replies are not supported`);
  }
  if (
    replies.length !== topic.replies ||
    replies.some((reply) => reply.topic_id !== topic.id)
  ) {
    throw new Error("V2EX returned an incomplete reply list; the old report was kept");
  }

  return {
    postId,
    title: topic.title,
    author: topic.member.username,
    url: `${V2EX_ORIGIN}/t/${postId}`,
    viewCount,
    replyCount: replies.length,
    totalPages: Math.max(1, Math.ceil(replies.length / 100)),
    comments: replies.map(normalizeReply),
  };
}
