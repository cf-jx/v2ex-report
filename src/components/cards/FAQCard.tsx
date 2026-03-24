"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquareQuote, Sparkles } from "lucide-react";
import type { FAQCard as FAQCardType } from "@/lib/types";

interface FAQCardProps {
  faq: FAQCardType;
  index: number;
}

export default function FAQCard({ faq, index }: FAQCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="bg-card border border-border rounded-sm transition-colors duration-300"
      style={{ borderTopColor: "var(--accent)", borderTopWidth: 2 }}
    >
      {/* Question header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-mono-data text-sm text-muted flex-shrink-0 mt-0.5">
            Q{index + 1}
          </span>
          <h3 className="font-serif-cn text-base font-bold text-foreground leading-relaxed">
            {faq.question}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className="text-xs text-muted whitespace-nowrap">
            {faq.frequency}条相关讨论
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-muted"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </button>

      {/* AI summary - always visible */}
      <div className="px-5 pb-4">
        <div className="flex items-start gap-2 p-3 rounded-sm bg-background/50">
          <Sparkles
            size={14}
            className="text-accent flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              AI 解读
            </span>
            <p className="mt-1 text-sm text-foreground/85 leading-relaxed">
              {faq.aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* OP answer - collapsible */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="op-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <hr className="rule-thin mb-4" />
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquareQuote
                  size={14}
                  className="text-accent"
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  OP 原话
                </span>
              </div>
              <blockquote className="pl-4 border-l-3 border-accent">
                <p className="font-serif-cn text-sm text-foreground/90 leading-loose italic">
                  {faq.opAnswer}
                </p>
              </blockquote>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
