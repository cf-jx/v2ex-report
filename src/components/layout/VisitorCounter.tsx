"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/stats", { method: "POST" })
      .then((res) => res.json())
      .then((data: { visitors: number }) => {
        if (!cancelled) setCount(data.visitors);
      })
      .catch(() => {
        // Silently fail - counter is non-critical
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <p className="text-xs text-muted">
      <span aria-hidden="true">👀</span>{" "}
      <span className="font-mono-data">{count.toLocaleString("en-US")}</span>{" "}
      <span className="font-serif-cn">次访问</span>
    </p>
  );
}
