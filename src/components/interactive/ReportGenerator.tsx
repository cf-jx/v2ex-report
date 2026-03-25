"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { RawComment } from "@/lib/scraper";

type Stage = "idle" | "scraping" | "analyzing" | "done" | "error";

interface ScrapedMeta {
  title: string;
  author: string;
  viewCount: number;
  favoriteCount: number;
  replyCount: number;
  totalPages: number;
}

export default function ReportGenerator({ postId }: { postId: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    setStage("scraping");
    setError("");

    try {
      // Step 1: Scrape page 1 to get metadata
      setProgress("Scraping page 1...");
      const p1Res = await fetch(
        `/api/scrape-page?postId=${postId}&page=1&startId=1`,
      );
      if (!p1Res.ok) {
        const err = await p1Res.json();
        throw new Error(err.error || "Failed to scrape page 1");
      }
      const p1 = await p1Res.json();
      const meta: ScrapedMeta = p1.meta;
      const allComments: RawComment[] = [...p1.comments];

      // Step 2: Scrape remaining pages
      for (let page = 2; page <= meta.totalPages; page++) {
        setProgress(`Scraping page ${page}/${meta.totalPages}...`);
        const res = await fetch(
          `/api/scrape-page?postId=${postId}&page=${page}&startId=${allComments.length + 1}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (!data.comments?.length) break;
        allComments.push(...data.comments);
      }

      // Step 3: Analyze
      setStage("analyzing");
      setProgress("Analyzing comments...");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          title: meta.title,
          author: meta.author,
          url: `https://www.v2ex.com/t/${postId}`,
          viewCount: meta.viewCount,
          favoriteCount: meta.favoriteCount,
          replyCount: meta.replyCount || allComments.length,
          totalPages: meta.totalPages,
          comments: allComments,
        }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }

      // Done — reload the page to show the report
      setStage("done");
      setProgress("Report ready!");
      router.refresh();
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [postId, router]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <h1 className="font-serif-cn text-2xl font-bold text-foreground">
        V2EX Post #{postId}
      </h1>
      <p className="text-sm text-muted font-serif-cn">
        No report found for this post. Click below to generate one.
      </p>

      {stage === "idle" && (
        <button
          onClick={generate}
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium
                     hover:bg-accent/90 active:bg-accent/80 transition-colors"
        >
          Generate Report
        </button>
      )}

      {(stage === "scraping" || stage === "analyzing") && (
        <div className="flex items-center justify-center gap-3 text-sm text-muted">
          <Loader2 size={18} className="animate-spin text-accent" />
          <span className="font-serif-cn">{progress}</span>
        </div>
      )}

      {stage === "done" && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle2 size={18} />
          <span className="font-serif-cn">{progress}</span>
        </div>
      )}

      {stage === "error" && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-red-500">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={generate}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg
                       hover:bg-accent/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
