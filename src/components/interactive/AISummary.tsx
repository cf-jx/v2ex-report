"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

type Status = "idle" | "loading" | "loaded" | "error" | "cooldown";

interface SummaryData {
  summary: string | null;
  generatedAt?: string;
}

export default function AISummary() {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  // Load existing summary on mount
  useEffect(() => {
    fetch("/api/generate-summary")
      .then((res) => res.json())
      .then((data: SummaryData) => {
        if (data.summary) {
          setSummary(data.summary);
          setGeneratedAt(data.generatedAt ?? null);
          setStatus("loaded");
        }
      })
      .catch(() => {
        // No existing summary, that's fine
      });
  }, []);

  const handleGenerate = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate-summary", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.summary) {
        setSummary(data.summary);
        setGeneratedAt(new Date().toISOString());
        setStatus("loaded");
      } else if (res.status === 429) {
        setStatus("cooldown");
        const retryAfter = data.retryAfter
          ? `${Math.ceil(data.retryAfter / 60)} 分钟`
          : "稍后";
        setErrorMsg(`请求过于频繁，请 ${retryAfter}后重试`);
      } else if (res.status === 503) {
        setStatus("error");
        setErrorMsg("AI 服务未配置，暂时无法生成总结");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "生成失败，请稍后重试");
      }
    } catch {
      setStatus("error");
      setErrorMsg("网络错误，请稍后重试");
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-card border border-border rounded-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h4 className="font-serif-cn text-lg font-bold text-foreground">
            AI 全文总结
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {summary && status !== "loading" && (
            <>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-sm border border-border
                  text-muted hover:text-accent hover:border-accent transition-colors"
                title="重新生成"
              >
                <RefreshCw size={12} />
                重新生成
              </button>
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-sm border border-border
                  text-muted hover:text-accent hover:border-accent transition-colors"
              >
                {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                {collapsed ? "展开" : "收起"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {summary ? (
        <div
          className={`space-y-3 overflow-hidden transition-all duration-300 ${
            collapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
          }`}
        >
          {summary.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-foreground font-serif-cn"
            >
              {paragraph}
            </p>
          ))}
          {generatedAt && (
            <p className="text-xs text-muted font-mono-data pt-2">
              Generated: {formatDate(generatedAt)}
            </p>
          )}
        </div>
      ) : status === "loading" ? (
        <div className="flex items-center justify-center py-8 gap-3">
          <RefreshCw size={16} className="animate-spin text-accent" />
          <span className="text-sm text-muted font-serif-cn">
            AI 正在分析全部评论，请稍候...
          </span>
        </div>
      ) : status === "error" || status === "cooldown" ? (
        <div className="flex flex-col items-center py-6 gap-3">
          <AlertCircle size={24} className="text-[var(--sentiment-negative)]" />
          <p className="text-sm text-[var(--sentiment-negative)] font-serif-cn">
            {errorMsg}
          </p>
          {status === "error" && (
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-sm border
                border-border bg-card text-foreground hover:border-accent hover:text-accent
                transition-colors mt-2"
            >
              <RefreshCw size={14} />
              重试
            </button>
          )}
        </div>
      ) : (
        /* idle - no existing summary */
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm text-muted font-serif-cn">
            基于 OP 全文与所有评论的智能总结
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-sm border
              border-accent text-accent hover:bg-accent hover:text-white
              transition-colors font-serif-cn"
          >
            <Sparkles size={14} />
            生成 AI 总结
          </button>
        </div>
      )}
    </div>
  );
}
