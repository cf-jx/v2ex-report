"use client";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  volume?: number;
  date: string;
  stats: {
    replies: number;
    commenters: number;
    views: number;
  };
}

export default function ReportHeader({
  title,
  subtitle,
  volume = 1,
  date,
  stats,
}: ReportHeaderProps) {
  const formatNumber = (n: number) => n.toLocaleString("zh-CN");

  return (
    <header className="relative w-full max-w-4xl mx-auto px-4 pt-8 pb-4">
      {/* Top double rule */}
      <hr className="rule-double" />

      {/* Masthead */}
      <div className="text-center py-6">
        <h1 className="font-headline text-4xl sm:text-5xl font-black tracking-wider uppercase leading-tight">
          The V2EX Chronicle
        </h1>
        <p className="mt-2 text-sm text-muted tracking-widest font-mono-data">
          Vol.{volume} &middot; {date}
        </p>
      </div>

      {/* Middle double rule */}
      <hr className="rule-double" />

      {/* Article title */}
      <div className="text-center py-6 space-y-2">
        <h2 className="font-serif-cn text-xl sm:text-2xl font-bold leading-relaxed">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base text-muted font-serif-cn leading-relaxed">
            ——{subtitle}
          </p>
        )}
      </div>

      {/* Thin rule */}
      <hr className="rule-single" />

      {/* Stats row */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 py-3 text-sm text-muted">
        <span className="font-mono-data">
          {formatNumber(stats.replies)}{" "}
          <span className="font-serif-cn">条回复</span>
        </span>
        <span className="text-border select-none" aria-hidden="true">│</span>
        <span className="font-mono-data">
          {formatNumber(stats.commenters)}{" "}
          <span className="font-serif-cn">位评论者</span>
        </span>
        <span className="text-border select-none" aria-hidden="true">│</span>
        <span className="font-mono-data">
          {formatNumber(stats.views)}{" "}
          <span className="font-serif-cn">次浏览</span>
        </span>
      </div>

      {/* Bottom double rule */}
      <hr className="rule-double" />
    </header>
  );
}
