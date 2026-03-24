"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface FilterState {
  topics: string[];
  sentiments: Array<"positive" | "neutral" | "negative">;
}

interface CommentFilterProps {
  topics: string[];
  onFilterChange: (state: FilterState) => void;
}

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "\u79EF\u6781", color: "var(--sentiment-positive)" },
  { value: "neutral", label: "\u4E2D\u7ACB", color: "var(--sentiment-neutral)" },
  { value: "negative", label: "\u6D88\u6781", color: "var(--sentiment-negative)" },
] as const;

export default function CommentFilter({
  topics,
  onFilterChange,
}: CommentFilterProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<
    Array<"positive" | "neutral" | "negative">
  >([]);

  const emit = useCallback(
    (t: string[], s: Array<"positive" | "neutral" | "negative">) => {
      onFilterChange({ topics: t, sentiments: s });
    },
    [onFilterChange],
  );

  const toggleTopic = (topic: string) => {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    emit(next, selectedSentiments);
  };

  const toggleSentiment = (value: "positive" | "neutral" | "negative") => {
    const next = selectedSentiments.includes(value)
      ? selectedSentiments.filter((s) => s !== value)
      : [...selectedSentiments, value];
    setSelectedSentiments(next);
    emit(selectedTopics, next);
  };

  const clearAll = () => {
    setSelectedTopics([]);
    setSelectedSentiments([]);
    emit([], []);
  };

  const hasFilters = selectedTopics.length > 0 || selectedSentiments.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Topic pills - horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {topics.map((topic) => {
          const active = selectedTopics.includes(topic);
          return (
            <motion.button
              key={topic}
              onClick={() => toggleTopic(topic)}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`
                flex-shrink-0 px-3 py-1 text-xs rounded-sm border transition-colors duration-200
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                ${
                  active
                    ? "bg-accent text-white border-accent"
                    : "bg-card text-muted border-border hover:border-foreground/30"
                }
              `}
              aria-pressed={active}
            >
              {topic}
            </motion.button>
          );
        })}
      </div>

      {/* Sentiment filters + clear */}
      <div className="flex items-center gap-2 flex-wrap">
        {SENTIMENT_OPTIONS.map(({ value, label, color }) => {
          const active = selectedSentiments.includes(value);
          return (
            <motion.button
              key={value}
              onClick={() => toggleSentiment(value)}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`
                flex items-center gap-1.5 px-3 py-1 text-xs rounded-sm border transition-colors duration-200
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                ${
                  active
                    ? "border-current bg-card text-foreground"
                    : "bg-card text-muted border-border hover:border-foreground/30"
                }
              `}
              aria-pressed={active}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {label}
            </motion.button>
          );
        })}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-foreground
              transition-colors duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X size={12} aria-hidden="true" />
            <span>清除筛选</span>
          </button>
        )}
      </div>
    </div>
  );
}
