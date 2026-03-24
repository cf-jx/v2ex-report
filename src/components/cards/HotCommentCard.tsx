"use client";

import type { Comment } from "@/lib/types";

interface HotCommentCardProps {
  comment: Comment;
  rank: number;
}

const SENTIMENT_COLORS: Record<Comment["sentiment"], string> = {
  positive: "var(--sentiment-positive)",
  neutral: "var(--sentiment-neutral)",
  negative: "var(--sentiment-negative)",
};

export default function HotCommentCard({ comment, rank }: HotCommentCardProps) {
  return (
    <article className="flex gap-4 py-4 border-b border-border/50 hover:bg-foreground/[0.02] transition-colors duration-200">
      {/* Rank number */}
      <div className="flex-shrink-0 w-10 text-right">
        <span className="font-mono-data text-2xl font-bold text-accent leading-none">
          {rank}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Author line */}
        <div className="flex items-center gap-2 mb-1.5">
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
              <span className="text-foreground/70">@{comment.replyTo}</span>
            </span>
          )}
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0 ml-auto"
            style={{ backgroundColor: SENTIMENT_COLORS[comment.sentiment] }}
            aria-label={`情感: ${comment.sentiment}`}
          />
        </div>

        {/* Comment body */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-2">
          {comment.content}
        </p>

        {/* Tags */}
        {comment.topics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
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
    </article>
  );
}
