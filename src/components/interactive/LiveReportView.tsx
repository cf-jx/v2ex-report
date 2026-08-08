"use client";

import ReportView from "@/components/layout/ReportView";
import { useLatestReport } from "@/components/interactive/useLatestReport";
import type { FAQCard, V2EXReport } from "@/lib/types";

interface LiveReportViewProps {
  report: V2EXReport;
  faqs: FAQCard[];
  postId: string;
}

export default function LiveReportView({
  report,
  faqs,
  postId,
}: LiveReportViewProps) {
  const latestReport = useLatestReport(report, postId);

  return <ReportView report={latestReport} faqs={faqs} postId={postId} />;
}
