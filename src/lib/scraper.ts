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
  favoriteCount: number;
  replyCount: number;
  totalPages: number;
  comments: RawComment[];
}

const JINA_PREFIX = "https://r.jina.ai/";

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(`${JINA_PREFIX}${url}`, {
    headers: { Accept: "text/markdown" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseMetaFromMarkdown(md: string): {
  title: string;
  author: string;
  viewCount: number;
  favoriteCount: number;
  replyCount: number;
} {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? "Unknown";

  // V2EX markdown typically has author in metadata or first mention
  const authorMatch = md.match(/\*\*(\w+)\*\*\s*·/) || md.match(/by\s+(\w+)/i);
  const author = authorMatch?.[1] ?? "unknown";

  const viewMatch = md.match(/(\d+)\s*次点击/);
  const viewCount = viewMatch ? parseInt(viewMatch[1], 10) : 0;

  const favMatch = md.match(/(\d+)\s*人收藏/);
  const favoriteCount = favMatch ? parseInt(favMatch[1], 10) : 0;

  const replyMatch = md.match(/(\d+)\s*条回复/);
  const replyCount = replyMatch ? parseInt(replyMatch[1], 10) : 0;

  return { title, author, viewCount, favoriteCount, replyCount };
}

function parseCommentsFromMarkdown(md: string, startId: number): RawComment[] {
  const comments: RawComment[] = [];

  // Match comment patterns: lines starting with "**username**" or numbered replies
  // V2EX r.jina.ai output typically has reply blocks
  const lines = md.split("\n");
  let currentComment: Partial<RawComment> | null = null;
  let id = startId;

  for (const line of lines) {
    // Pattern: "**username** ..." or "第 N 楼" or "@username" mentions
    const userMatch = line.match(/^\*\*(\w+)\*\*/);
    if (userMatch) {
      if (currentComment?.author) {
        comments.push(currentComment as RawComment);
      }
      const replyToMatch = line.match(/@(\w+)/);
      currentComment = {
        id: id++,
        author: userMatch[1],
        content: line
          .replace(/^\*\*\w+\*\*\s*/, "")
          .replace(/@\w+\s*/, "")
          .trim(),
        replyTo: replyToMatch?.[1] ?? null,
      };
    } else if (currentComment && line.trim() && !line.startsWith("#")) {
      // Append content to current comment
      currentComment.content =
        ((currentComment.content as string) + " " + line.trim()).trim();
    }
  }

  if (currentComment?.author) {
    comments.push(currentComment as RawComment);
  }

  return comments;
}

export async function scrapeV2EXPost(postId: string): Promise<RawPostData> {
  const baseUrl = `https://www.v2ex.com/t/${postId}`;

  // Fetch first page to get metadata
  const page1 = await fetchPage(baseUrl);
  const meta = parseMetaFromMarkdown(page1);

  const allComments: RawComment[] = [];

  // Parse first page comments
  const page1Comments = parseCommentsFromMarkdown(page1, 1);
  allComments.push(...page1Comments);

  // Determine total pages from reply count (V2EX shows ~100 replies per page)
  const estimatedPages = Math.ceil(meta.replyCount / 100);

  // Fetch remaining pages
  for (let p = 2; p <= Math.max(estimatedPages, 2); p++) {
    try {
      const pageContent = await fetchPage(`${baseUrl}?p=${p}`);
      const pageComments = parseCommentsFromMarkdown(
        pageContent,
        allComments.length + 1,
      );
      if (pageComments.length === 0) break;
      allComments.push(...pageComments);
    } catch {
      break;
    }
  }

  return {
    postId,
    title: meta.title,
    author: meta.author,
    url: baseUrl,
    viewCount: meta.viewCount,
    favoriteCount: meta.favoriteCount,
    replyCount: meta.replyCount || allComments.length,
    totalPages: estimatedPages,
    comments: allComments,
  };
}
