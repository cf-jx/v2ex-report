"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import type { Comment } from "@/lib/types";
import SearchBar from "./SearchBar";
import CommentFilter, { type FilterState } from "./CommentFilter";

const PAGE_SIZE = 20;

interface CommentListProps {
  comments: Comment[];
}

const SENTIMENT_COLORS: Record<Comment["sentiment"], string> = {
  positive: "var(--sentiment-positive)",
  neutral: "var(--sentiment-neutral)",
  negative: "var(--sentiment-negative)",
};

/** Highlight matching text segments with a yellow background. */
function highlightText(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-yellow-200/80 text-foreground rounded-sm px-0.5"
        style={{ backgroundColor: "rgba(233, 196, 106, 0.4)" }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function CommentList({ comments }: CommentListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    topics: [],
    sentiments: [],
  });
  const [page, setPage] = useState(1);

  // Extract all unique topics once
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    for (const c of comments) {
      for (const t of c.topics) set.add(t);
    }
    return Array.from(set).sort();
  }, [comments]);

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((state: FilterState) => {
    setFilters(state);
    setPage(1);
  }, []);

  // Filter + search
  const filtered = useMemo(() => {
    let result = comments;

    // Topic filter
    if (filters.topics.length > 0) {
      result = result.filter((c) =>
        c.topics.some((t) => filters.topics.includes(t)),
      );
    }

    // Sentiment filter
    if (filters.sentiments.length > 0) {
      result = result.filter((c) => filters.sentiments.includes(c.sentiment));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q),
      );
    }

    return result;
  }, [comments, filters, search]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <SearchBar onSearch={handleSearch} placeholder="搜索评论内容或作者..." />

      {/* Filters */}
      {allTopics.length > 0 && (
        <CommentFilter topics={allTopics} onFilterChange={handleFilterChange} />
      )}

      {/* Result count */}
      <p className="text-xs text-muted font-mono-data">
        显示 {visible.length} / {filtered.length} 条评论
        {filtered.length !== comments.length && (
          <span className="ml-1">(共 {comments.length} 条)</span>
        )}
      </p>

      <hr className="rule-single" />

      {/* Comment rows */}
      <div className="flex flex-col">
        {visible.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 py-3 border-b border-border/40 hover:bg-foreground/[0.02] transition-colors duration-150"
          >
            {/* Floor number */}
            <span className="font-mono-data text-xs text-muted flex-shrink-0 w-8 text-right pt-0.5">
              #{comment.id}
            </span>

            {/* Body */}
            <div className="min-w-0 flex-1">
              {/* Author + sentiment */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-sm ${
                    comment.isOP ? "font-bold text-foreground" : "text-muted"
                  }`}
                >
                  {comment.author}
                </span>
                {comment.isOP && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-sm leading-none">
                    OP
                  </span>
                )}
                {comment.replyTo && (
                  <span className="text-xs text-muted">
                    回复{" "}
                    <span className="text-foreground/70">
                      @{comment.replyTo}
                    </span>
                  </span>
                )}
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ml-auto"
                  style={{
                    backgroundColor: SENTIMENT_COLORS[comment.sentiment],
                  }}
                  aria-label={`情感: ${comment.sentiment}`}
                />
              </div>

              {/* Content with search highlight */}
              <p className="text-sm text-foreground/90 leading-relaxed">
                {highlightText(comment.content, search)}
              </p>

              {/* Topic tags */}
              {comment.topics.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {comment.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 text-[10px] text-muted bg-background border border-border rounded-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            没有匹配的评论
          </p>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="self-center px-6 py-2 text-sm text-muted border border-border rounded-sm
            hover:border-foreground/30 hover:text-foreground
            transition-colors duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          加载更多
        </button>
      )}
    </div>
  );
}
