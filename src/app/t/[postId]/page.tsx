export const revalidate = 3600;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportData, getFAQData } from "@/lib/data";
import ReportView from "@/components/layout/ReportView";
import ReportGenerator from "@/components/interactive/ReportGenerator";

interface Props {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const report = await getReportData(postId);

  if (!report) {
    return {
      title: `Generating Report - The V2EX Chronicle`,
      description: `V2EX post #${postId} analysis report`,
    };
  }

  return {
    title: `${report.meta.title} - The V2EX Chronicle`,
    description: `V2EX 帖子「${report.meta.title}」的评论可视化分析报告`,
    openGraph: {
      title: `${report.meta.title} - The V2EX Chronicle`,
      description: `V2EX 帖子「${report.meta.title}」的评论可视化分析报告`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${report.meta.title} - The V2EX Chronicle`,
    },
  };
}

export default async function PostReportPage({ params }: Props) {
  const { postId } = await params;

  if (!/^\d+$/.test(postId)) {
    notFound();
  }

  const [report, faqs] = await Promise.all([
    getReportData(postId),
    getFAQData(postId),
  ]);

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <ReportGenerator postId={postId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ReportView report={report} faqs={faqs} postId={postId} />
    </div>
  );
}
