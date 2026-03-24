"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface BarDatum {
  label: string;
  value: number;
  color?: string;
  /** Optional tag to display after the value */
  tag?: string;
}

interface AnimatedBarChartProps {
  data: BarDatum[];
  maxValue?: number;
}

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AnimatedBarChart({
  data,
  maxValue: maxValueProp,
}: AnimatedBarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const maxValue = maxValueProp ?? Math.max(...data.map((d) => d.value));

  return (
    <div ref={ref} className="space-y-3" role="img" aria-label="Bar chart">
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        return (
          <div key={item.label} className="flex items-center gap-3">
            {/* Label */}
            <span className="w-28 sm:w-36 text-right text-sm text-foreground truncate flex-shrink-0 font-serif-cn">
              {item.label}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-5 bg-border/30 rounded-sm overflow-hidden relative">
              <motion.div
                className="h-full rounded-sm"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${pct}%` } : { width: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>

            {/* Value */}
            <span className="w-16 text-right text-sm font-mono-data text-muted tabular-nums flex-shrink-0">
              {item.value.toLocaleString("zh-CN")}
              {item.tag && (
                <span className="text-xs ml-0.5 text-muted/70">{item.tag}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
