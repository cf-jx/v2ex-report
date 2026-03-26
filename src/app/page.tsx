export const revalidate = 60;

import { getReportData, getFAQData } from "@/lib/data";
import ReportView from "@/components/layout/ReportView";
import URLInput from "@/components/interactive/URLInput";
import HomeRealtimeProbe from "@/components/interactive/HomeRealtimeProbe";

const POST_ID = "1200385";

export default async function Home() {
  const [report, faqs] = await Promise.all([
    getReportData(POST_ID),
    getFAQData(POST_ID),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <HomeRealtimeProbe postId={POST_ID} />
      {/* URL Input Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <URLInput />
      </div>

      {report ? (
        <ReportView report={report} faqs={faqs} postId={POST_ID} />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted">
          <p className="font-serif-cn">Failed to load report data.</p>
        </div>
      )}
    </div>
  );
}
