"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface HomeRealtimeProbeProps {
  postId: string;
  intervalMs?: number;
}

export default function HomeRealtimeProbe({
  postId,
  intervalMs = 60_000,
}: HomeRealtimeProbeProps) {
  const router = useRouter();
  const inFlight = useRef(false);

  useEffect(() => {
    let stopped = false;

    async function tick() {
      if (stopped || inFlight.current) return;
      inFlight.current = true;
      try {
        const probeRes = await fetch(`/api/probe?postId=${postId}`, {
          cache: "no-store",
        });
        if (!probeRes.ok) return;

        const probe = (await probeRes.json()) as { hasUpdate?: boolean };
        if (!probe.hasUpdate) return;

        const refreshRes = await fetch("/api/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        if (!refreshRes.ok) return;

        const refreshData = (await refreshRes.json()) as { refreshed?: boolean };
        if (refreshData.refreshed) {
          router.refresh();
        }
      } catch {
        // no-op
      } finally {
        inFlight.current = false;
      }
    }

    const timer = setInterval(tick, intervalMs);
    void tick();

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [intervalMs, postId, router]);

  return null;
}
