"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface AnimatedPieChartProps {
  data: PieSlice[];
  /** Outer radius of the chart */
  size?: number;
  /** Stroke width of the donut ring */
  strokeWidth?: number;
}

export default function AnimatedPieChart({
  data,
  size = 180,
  strokeWidth = 32,
}: AnimatedPieChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate each segment's offset and length
  let accumulated = 0;
  const segments = data.map((slice) => {
    const pct = total > 0 ? slice.value / total : 0;
    const length = pct * circumference;
    const offset = accumulated;
    accumulated += length;
    return { ...slice, pct, length, offset };
  });

  return (
    <div ref={ref} className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG donut */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="flex-shrink-0"
        role="img"
        aria-label="Pie chart"
      >
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            // Rotate -90deg so the first segment starts at top
            transform={`rotate(-90 ${center} ${center})`}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            initial={{ strokeDashoffset: circumference }}
            animate={
              isInView
                ? { strokeDashoffset: circumference - seg.offset }
                : { strokeDashoffset: circumference }
            }
            transition={{
              duration: 1,
              delay: i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
        {/* Center label */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-sm font-mono-data"
          style={{ fontSize: "14px" }}
        >
          {total.toLocaleString("zh-CN")}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className="text-foreground font-serif-cn">{seg.label}</span>
            <span className="text-muted font-mono-data tabular-nums ml-auto pl-3">
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
