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
  const titleMatch = md.match(
    /^#\s+(.+?)(?:\s*-\s*V2EX)?$/m,
  );
  const title = titleMatch?.[1]?.trim() ?? "Unknown";

  const authorMatch =
    md.match(/\[(\w+)\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)\s*·/) ||
    md.match(/\*\*(\w+)\*\*\s*·/);
  const author = authorMatch?.[1] ?? "unknown";

  const viewMatch = md.match(/([\d,]+)\s*次点击/);
  const viewCount = viewMatch
    ? parseInt(viewMatch[1].replace(/,/g, ""), 10)
    : 0;

  const favMatch = md.match(/([\d,]+)\s*人收藏/);
  const favoriteCount = favMatch
    ? parseInt(favMatch[1].replace(/,/g, ""), 10)
    : 0;

  const replyMatch = md.match(/([\d,]+)\s*条回复/);
  const replyCount = replyMatch
    ? parseInt(replyMatch[1].replace(/,/g, ""), 10)
    : 0;

  return { title, author, viewCount, favoriteCount, replyCount };
}

function parseCommentsFromMarkdown(
  md: string,
  startId: number,
): RawComment[] {
  const comments: RawComment[] = [];
  const lines = md.split("\n");
  let id = startId;

  for (let i = 0; i < lines.length; i++) {
    // Look for: **[username](https://www.v2ex.com/member/username)**<timestamp>
    const userLineMatch = lines[i].match(
      /^\*\*\[(\w+)\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)\*\*/,
    );
    if (!userLineMatch) continue;

    const author = userLineMatch[1];

    // Skip optional "OP" and timestamp lines
    let j = i + 1;
    while (j < lines.length) {
      const trimmed = lines[j].trim();
      if (
        trimmed === "" ||
        trimmed === "OP" ||
        /^\d+\s*(天|小时|分钟|秒)/.test(trimmed) ||
        /^via\s+(Android|iPhone)/i.test(trimmed) ||
        /天前/.test(trimmed)
      ) {
        j++;
      } else {
        break;
      }
    }

    // Collect content lines until next image block (avatar of next comment)
    const contentLines: string[] = [];
    let replyTo: string | null = null;

    while (j < lines.length) {
      const line = lines[j];

      // Next comment starts with ![Image ...
      if (line.startsWith("![Image")) break;
      // Or pagination links
      if (line.startsWith("[1]") || line.startsWith("[❮")) break;

      const trimmed = line.trim();
      if (trimmed) {
        // Extract @mention
        const mentionMatch = trimmed.match(
          /@\[(\w+)\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)/,
        );
        if (mentionMatch && !replyTo) {
          replyTo = mentionMatch[1];
        }

        // Clean: remove @[user](link) and ![heart] patterns
        const cleaned = trimmed
          .replace(
            /@\[\w+\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)\s*/g,
            "",
          )
          .replace(/!\[Image[^\]]*\]\([^)]*\)\s*/g, "")
          .replace(/!\[[^\]]*\]\([^)]*\)\s*/g, "")
          .trim();

        if (cleaned) contentLines.push(cleaned);
      }
      j++;
    }

    const content = contentLines.join(" ").trim();
    if (content) {
      comments.push({ id: id++, author, content, replyTo });
    }

    // Don't skip i forward — the for loop will continue scanning
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
