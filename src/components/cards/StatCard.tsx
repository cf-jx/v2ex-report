"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";

interface StatCardProps {
  value: number;
  label: string;
  icon?: ReactNode;
  /** Decimal places for the displayed number */
  precision?: number;
}

function AnimatedNumber({
  value,
  precision = 0,
}: {
  value: number;
  precision: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    precision > 0 ? latest.toFixed(precision) : Math.round(latest).toLocaleString("zh-CN")
  );
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 1.5,
        ease: [0.22, 1, 0.36, 1],
      });
      return controls.stop;
    }
  }, [isInView, motionValue, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function StatCard({
  value,
  label,
  icon,
  precision = 0,
}: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 p-6 bg-card border border-border rounded-sm
        transition-colors duration-300"
    >
      {icon && (
        <div className="text-accent mb-1" aria-hidden="true">
          {icon}
        </div>
      )}
      <span className="font-mono-data text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
        <AnimatedNumber value={value} precision={precision} />
      </span>
      <span className="text-sm text-muted font-serif-cn tracking-wide">
        {label}
      </span>
    </div>
  );
}
