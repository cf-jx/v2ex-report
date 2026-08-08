import { notFound } from "next/navigation";
import LivePosterPreview from "@/components/poster/LivePosterPreview";
import { staticPostIds } from "@/data/reports";
import { getFAQData, getReportData } from "@/lib/data";

interface PosterPageProps {
  params: Promise<{ postId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return staticPostIds.map((postId) => ({ postId }));
}

export default async function PosterPage({ params }: PosterPageProps) {
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

  return <LivePosterPreview report={report} faqs={faqs} postId={postId} />;
}
