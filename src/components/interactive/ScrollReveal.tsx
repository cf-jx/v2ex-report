"use client";

import { type ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Vertical offset in px */
  offsetY?: number;
  /** Viewport margin for trigger detection */
  margin?: string;
  className?: string;
}

export default function ScrollReveal({
  children,
  delay = 0,
  offsetY = 20,
  margin = "-60px",
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offsetY }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: offsetY }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
