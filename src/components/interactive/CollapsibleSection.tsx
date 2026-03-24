"use client";

import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-sm bg-card transition-colors duration-300">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={isOpen}
      >
        <span className="font-serif-cn text-lg font-bold text-foreground">
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-muted flex-shrink-0 ml-4"
          aria-hidden="true"
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <hr className="rule-thin mb-4" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
