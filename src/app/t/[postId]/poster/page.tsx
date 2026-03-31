import { notFound } from "next/navigation";
import PosterPreview from "@/components/poster/PosterPreview";
import { getFAQData, getReportData } from "@/lib/data";
import { buildPosterContent } from "@/lib/poster-content";

interface PosterPageProps {
  params: Promise<{ postId: string }>;
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

  const content = buildPosterContent(report, faqs);
  return <PosterPreview content={content} />;
}
