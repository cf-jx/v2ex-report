"use client";

import { useMemo } from "react";
import { useLatestReport } from "@/components/interactive/useLatestReport";
import { buildPosterContent } from "@/lib/poster-content";
import type { FAQCard, V2EXReport } from "@/lib/types";
import PosterPreview from "./PosterPreview";

interface LivePosterPreviewProps {
  report: V2EXReport;
  faqs: FAQCard[];
  postId: string;
}

export default function LivePosterPreview({
  report,
  faqs,
  postId,
}: LivePosterPreviewProps) {
  const latestReport = useLatestReport(report, postId);
  const content = useMemo(
    () => buildPosterContent(latestReport, faqs),
    [faqs, latestReport],
  );

  return <PosterPreview content={content} />;
}
