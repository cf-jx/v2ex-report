"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface StaleCheckerProps {
  postId: string;
  lastFetched: string;
  /** Hours before data is considered stale */
  staleHours?: number;
}

export default function StaleChecker({
  postId,
  lastFetched,
  staleHours = 4,
}: StaleCheckerProps) {
  const router = useRouter();
  const triggered = useRef(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (triggered.current) return;

    const age = Date.now() - new Date(lastFetched).getTime();
    if (age < staleHours * 3600 * 1000) return;

    triggered.current = true;
    setUpdating(true);

    fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.refreshed) {
          router.refresh();
        }
      })
      .catch(() => {})
      .finally(() => setUpdating(false));
  }, [postId, lastFetched, staleHours, router]);

  if (!updating) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-surface border border-border rounded-lg shadow-sm text-xs text-muted font-serif-cn animate-pulse">
      数据更新中…
    </div>
  );
}
