"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SentimentGaugeProps {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentGauge({
  positive,
  neutral,
  negative,
}: SentimentGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const total = positive + neutral + negative;
  const pctPos = total > 0 ? (positive / total) * 100 : 0;
  const pctNeu = total > 0 ? (neutral / total) * 100 : 0;
  const pctNeg = total > 0 ? (negative / total) * 100 : 0;

  const segments = [
    { pct: pctPos, label: `${pctPos.toFixed(0)}%`, color: "var(--sentiment-positive)", name: "Positive" },
    { pct: pctNeu, label: `${pctNeu.toFixed(0)}%`, color: "var(--sentiment-neutral)", name: "Neutral" },
    { pct: pctNeg, label: `${pctNeg.toFixed(0)}%`, color: "var(--sentiment-negative)", name: "Negative" },
  ];

  return (
    <div ref={ref} className="space-y-3">
      {/* Bar */}
      <div
        className="flex h-8 rounded-sm overflow-hidden border border-border"
        role="img"
        aria-label={`Sentiment: ${pctPos.toFixed(0)}% positive, ${pctNeu.toFixed(0)}% neutral, ${pctNeg.toFixed(0)}% negative`}
      >
        {segments.map((seg) =>
          seg.pct > 0 ? (
            <motion.div
              key={seg.name}
              className="flex items-center justify-center text-xs font-mono-data font-semibold"
              style={{ backgroundColor: seg.color, color: seg.name === "Neutral" ? "#1a1a1a" : "#ffffff" }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${seg.pct}%` } : { width: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {seg.pct >= 8 && seg.label}
            </motion.div>
          ) : null
        )}
      </div>

      {/* Legend row */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className="font-serif-cn">
              {seg.name === "Positive" && "积极"}
              {seg.name === "Neutral" && "中立"}
              {seg.name === "Negative" && "消极"}
            </span>
            <span className="font-mono-data tabular-nums">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
