import { MessageCircle, Users, Reply, Bookmark } from "lucide-react";
import ReportHeader from "@/components/layout/ReportHeader";
import StatCard from "@/components/cards/StatCard";
import AnimatedBarChart from "@/components/charts/AnimatedBarChart";
import AnimatedPieChart from "@/components/charts/AnimatedPieChart";
import SentimentGauge from "@/components/charts/SentimentGauge";
import ScrollReveal from "@/components/interactive/ScrollReveal";
import HotCommentCard from "@/components/cards/HotCommentCard";
import FAQCard from "@/components/cards/FAQCard";
import CommentList from "@/components/interactive/CommentList";
import AISummary from "@/components/interactive/AISummary";
import LikeButton from "@/components/interactive/LikeButton";
import VisitorCounter from "@/components/layout/VisitorCounter";
import StaleChecker from "@/components/interactive/StaleChecker";
import Link from "next/link";
import type { V2EXReport, FAQCard as FAQCardType } from "@/lib/types";

interface ReportViewProps {
  report: V2EXReport;
  faqs: FAQCardType[];
  postId: string;
}

export default function ReportView({ report, faqs, postId }: ReportViewProps) {
  const { meta, comments, analysis } = report;
  const { sentimentBreakdown, topUsers, topicDistribution, hotComments, opStats } = analysis;

  const uniqueCommenters = new Set(comments.map((c) => c.author)).size;

  const top10Users = topUsers.slice(0, 10).map((u) => ({
    label: u.name,
    value: u.count,
    color: u.isOP ? "var(--accent)" : undefined,
    tag: u.isOP ? "OP" : undefined,
  }));

  const topicBarData = topicDistribution.map((t) => ({
    label: t.name,
    value: t.count,
    color: t.color,
  }));

  const sentimentPieData = [
    { label: "积极", value: sentimentBreakdown.positive, color: "var(--sentiment-positive)" },
    { label: "中立", value: sentimentBreakdown.neutral, color: "var(--sentiment-neutral)" },
    { label: "消极", value: sentimentBreakdown.negative, color: "var(--sentiment-negative)" },
  ];

  const lastUpdated = new Date(meta.lastFetched).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <StaleChecker postId={postId} lastFetched={meta.lastFetched} />

      {/* ── 1. Header ── */}
      <ReportHeader
        title={meta.title}
        subtitle={`作者: ${meta.author}`}
        volume={1}
        date={lastUpdated.split(" ")[0] ?? lastUpdated}
        stats={{ replies: meta.replyCount, commenters: uniqueCommenters, views: meta.viewCount }}
      />

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {/* ── 1.5 Post Summary ── */}
        <section className="bg-surface/50 border border-border rounded-lg px-5 py-4">
          <h2 className="font-serif-cn text-base font-bold text-foreground mb-1">
            帖子简介
          </h2>
          <p className="text-sm text-muted font-serif-cn leading-relaxed">
            {meta.title}
          </p>
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-accent hover:underline underline-offset-2 transition-colors"
          >
            查看原帖 &rarr;
          </a>
        </section>

        {/* ── 2. Key Metrics Row ── */}
        <ScrollReveal>
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard value={meta.replyCount} label="总回复" icon={<MessageCircle size={20} />} />
              <StatCard value={topUsers.length} label="活跃用户" icon={<Users size={20} />} />
              <StatCard value={opStats.responseRate} label="OP 回复率 %" icon={<Reply size={20} />} precision={1} />
              <StatCard value={meta.favoriteCount} label="收藏" icon={<Bookmark size={20} />} />
            </div>
          </section>
        </ScrollReveal>

        {/* ── 3. Topic Distribution ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <h3 className="font-serif-cn text-xl font-bold mb-6 text-foreground">话题分布</h3>
            <AnimatedBarChart data={topicBarData} />
          </section>
        </ScrollReveal>

        {/* ── 4. Sentiment Analysis ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <h3 className="font-serif-cn text-xl font-bold mb-6 text-foreground">情感分析</h3>
            <div className="space-y-8">
              <SentimentGauge
                positive={sentimentBreakdown.positive}
                neutral={sentimentBreakdown.neutral}
                negative={sentimentBreakdown.negative}
              />
              <AnimatedPieChart data={sentimentPieData} />
            </div>
          </section>
        </ScrollReveal>

        {/* ── 5. Active Users ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <h3 className="font-serif-cn text-xl font-bold mb-6 text-foreground">活跃用户 TOP 10</h3>
            <AnimatedBarChart data={top10Users} />
          </section>
        </ScrollReveal>

        {/* ── 6. AI Full Summary ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <AISummary postId={postId} />
          </section>
        </ScrollReveal>

        {/* ── 7. FAQ Section ── */}
        {faqs.length > 0 && (
          <ScrollReveal>
            <section>
              <hr className="rule-thin mb-4" />
              <h3 className="font-serif-cn text-xl font-bold mb-2 text-foreground">高频问题 AI 解读</h3>
              <p className="text-sm text-muted font-serif-cn mb-6">
                基于 {meta.replyCount} 条评论的智能分析
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((faq, i) => (
                  <ScrollReveal key={faq.id} delay={i * 0.08}>
                    <FAQCard faq={faq} index={i} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* ── 8. Hot Comments ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <h3 className="font-serif-cn text-xl font-bold mb-6 text-foreground">精华评论</h3>
            <div className="space-y-4">
              {hotComments.map((comment, i) => (
                <ScrollReveal key={comment.id} delay={i * 0.08}>
                  <HotCommentCard comment={comment} rank={i + 1} />
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── 9. All Comments Browser ── */}
        <ScrollReveal>
          <section>
            <hr className="rule-thin mb-4" />
            <h3 className="font-serif-cn text-xl font-bold mb-6 text-foreground">全部评论</h3>
            <CommentList comments={comments} />
          </section>
        </ScrollReveal>
      </main>

      {/* ── 10. Footer ── */}
      <footer className="max-w-4xl mx-auto px-4 py-8">
        <hr className="rule-double mb-6" />
        <div className="text-center space-y-4">
          <div className="flex justify-center pb-2">
            <LikeButton postId={postId} />
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted">
            <a href="https://www.v2ex.com/member/scf2024" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="V2EX">V2EX</a>
            <span className="text-border select-none" aria-hidden="true">·</span>
            <a href="https://x.com/websol241803" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="X (Twitter)">𝕏</a>
            <span className="text-border select-none" aria-hidden="true">·</span>
            <a href="https://github.com/cf-jx" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="GitHub">GitHub</a>
            <span className="text-border select-none" aria-hidden="true">·</span>
            <a href="https://mp.weixin.qq.com/s/eUlC-QDp4SR7AvSJqHutUw" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="微信公众号">公众号：布布的ai实验室</a>
          </div>

          <hr className="rule-thin" />

          <div className="space-y-2">
            <p className="text-xs text-muted font-serif-cn">
              数据来源:{" "}
              <a href={meta.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent transition-colors">V2EX 原帖</a>
            </p>
            <p className="text-xs text-muted font-serif-cn">
              海报导出:{" "}
              <Link
                href={`/t/${postId}/poster`}
                className="underline underline-offset-2 hover:text-accent transition-colors"
              >
                打开 pretext 海报页
              </Link>
            </p>
            <p className="text-xs text-muted font-mono-data">Last updated: {lastUpdated}</p>
            <p className="text-xs text-muted font-serif-cn">The V2EX Chronicle &mdash; Generated with AI-powered analysis</p>
            <p className="text-xs text-muted font-serif-cn">&copy; {new Date().getFullYear()} 布布ai. All rights reserved.</p>
            <VisitorCounter />
          </div>
        </div>
      </footer>
    </>
  );
}
