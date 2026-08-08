import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { staticPostIds } from "@/data/reports";
import { getReportData, getFAQData } from "@/lib/data";
import LiveReportView from "@/components/interactive/LiveReportView";

interface Props {
  params: Promise<{ postId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return staticPostIds.map((postId) => ({ postId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  if (!/^\d+$/.test(postId)) {
    return {
      title: "Not Found - The V2EX Chronicle",
      description: "Invalid post ID",
      robots: { index: false, follow: false },
    };
  }
  const report = await getReportData(postId);

  if (!report) {
    return {
      title: "Not Found - The V2EX Chronicle",
      description: "Report not found",
      robots: { index: false, follow: false },
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
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveReportView report={report} faqs={faqs} postId={postId} />
    </div>
  );
}
