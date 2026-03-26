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
  return await res.text();
}

function parseMetaFromMarkdown(md: string): {
  title: string;
  author: string;
  viewCount: number;
  favoriteCount: number;
  replyCount: number;
} {
  const markdownTitleMatch = md.match(/^#\s+(.+?)(?:\s*-\s*V2EX)?$/m);
  const frontMatterTitleMatch = md.match(/^Title:\s+(.+?)(?:\s*-\s*V2EX)?$/m);
  const title =
    markdownTitleMatch?.[1]?.trim() ??
    frontMatterTitleMatch?.[1]?.trim() ??
    "Unknown";

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
      // Pagination links
      if (line.startsWith("[1]") || line.startsWith("[❮")) break;
      // V2EX site footer
      if (
        /\*\*\[关于\]/.test(line) ||
        /人在线\*\*/.test(line) ||
        /World is powered by/.test(line) ||
        /Do have faith in/.test(line) ||
        /digitalocean\.com/.test(line)
      ) break;

      const trimmed = line.trim();
      if (trimmed) {
        // Extract @mention
        const mentionMatch = trimmed.match(
          /@\[(\w+)\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)/,
        );
        if (mentionMatch && !replyTo) {
          replyTo = mentionMatch[1];
        }

        // Clean: remove @[user](link), images, and markdown links
        const cleaned = trimmed
          .replace(
            /@\[\w+\]\(https?:\/\/www\.v2ex\.com\/member\/\w+\)\s*/g,
            "",
          )
          .replace(/!\[Image[^\]]*\]\([^)]*\)\s*/g, "")
          .replace(/!\[[^\]]*\]\([^)]*\)\s*/g, "")
          // Convert [text](url) markdown links to just text
          .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
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

/**
 * Scrape a single page of a V2EX post.
 * Page 1 returns metadata + comments; subsequent pages return comments only.
 */
export interface ScrapedPage {
  meta?: {
    title: string;
    author: string;
    viewCount: number;
    favoriteCount: number;
    replyCount: number;
    totalPages: number;
  };
  comments: RawComment[];
}

export async function scrapeV2EXPage(
  postId: string,
  page: number,
  commentStartId: number = 1,
): Promise<ScrapedPage> {
  const baseUrl = `https://www.v2ex.com/t/${postId}`;
  const url = page === 1 ? baseUrl : `${baseUrl}?p=${page}`;
  const md = await fetchPage(url);
  const comments = parseCommentsFromMarkdown(md, commentStartId);

  if (page === 1) {
    const parsed = parseMetaFromMarkdown(md);
    const totalPages = Math.max(Math.ceil(parsed.replyCount / 100), 1);
    return { meta: { ...parsed, totalPages }, comments };
  }

  return { comments };
}

/**
 * Scrape all pages of a V2EX post at once. Used by cron job.
 */
export async function scrapeV2EXPost(postId: string): Promise<RawPostData> {
  const first = await scrapeV2EXPage(postId, 1);
  const meta = first.meta!;
  const allComments = [...first.comments];

  for (let p = 2; p <= meta.totalPages; p++) {
    try {
      const page = await scrapeV2EXPage(postId, p, allComments.length + 1);
      if (page.comments.length === 0) break;
      allComments.push(...page.comments);
    } catch {
      break;
    }
  }

  return {
    postId,
    title: meta.title,
    author: meta.author,
    url: `https://www.v2ex.com/t/${postId}`,
    viewCount: meta.viewCount,
    favoriteCount: meta.favoriteCount,
    replyCount: meta.replyCount || allComments.length,
    totalPages: meta.totalPages,
    comments: allComments,
  };
}
