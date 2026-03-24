"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface FAQVoteButtonsProps {
  faqId: string;
}

interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

const STORAGE_KEY = "v2ex-faq-votes";

function getVotedIds(): Record<string, "up" | "down"> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, "up" | "down">) : {};
  } catch {
    return {};
  }
}

function markVoted(faqId: string, vote: "up" | "down"): void {
  const voted = getVotedIds();
  voted[faqId] = vote;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(voted));
}

export default function FAQVoteButtons({ faqId }: FAQVoteButtonsProps) {
  const [counts, setCounts] = useState<VoteCounts>({ upvotes: 0, downvotes: 0 });
  const [votedType, setVotedType] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  // Check localStorage for existing vote on mount
  useEffect(() => {
    const voted = getVotedIds();
    if (voted[faqId]) {
      setVotedType(voted[faqId]);
    }
  }, [faqId]);

  const handleVote = useCallback(
    async (vote: "up" | "down") => {
      if (votedType || loading) return;
      setLoading(true);

      try {
        const res = await fetch("/api/faq-vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faqId, vote }),
        });

        if (!res.ok) return;

        const data = (await res.json()) as VoteCounts;
        setCounts(data);
        setVotedType(vote);
        markVoted(faqId, vote);
      } catch {
        // Silently fail - vote is non-critical
      } finally {
        setLoading(false);
      }
    },
    [faqId, votedType, loading],
  );

  return (
    <div className="flex items-center gap-3 pt-2">
      <motion.button
        whileTap={!votedType ? { scale: 1.3 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        onClick={() => handleVote("up")}
        disabled={!!votedType || loading}
        className="flex items-center gap-1 text-xs text-muted hover:text-foreground
          disabled:opacity-50 disabled:cursor-default transition-colors"
        aria-label={`Upvote question ${faqId}`}
      >
        <span aria-hidden="true">👍</span>
        <span className="font-mono-data">
          {counts.upvotes > 0 ? counts.upvotes : ""}
        </span>
      </motion.button>

      <motion.button
        whileTap={!votedType ? { scale: 1.3 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        onClick={() => handleVote("down")}
        disabled={!!votedType || loading}
        className="flex items-center gap-1 text-xs text-muted hover:text-foreground
          disabled:opacity-50 disabled:cursor-default transition-colors"
        aria-label={`Downvote question ${faqId}`}
      >
        <span aria-hidden="true">👎</span>
        <span className="font-mono-data">
          {counts.downvotes > 0 ? counts.downvotes : ""}
        </span>
      </motion.button>
    </div>
  );
}
