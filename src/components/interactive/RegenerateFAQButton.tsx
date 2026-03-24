"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error" | "cooldown";

export default function RegenerateFAQButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/generate-faq", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`已生成 ${data.faqCount} 个 FAQ，刷新页面查看`);
        // Auto-reload after 2s
        setTimeout(() => window.location.reload(), 2000);
      } else if (res.status === 429) {
        setStatus("cooldown");
        const retryAfter = data.retryAfter
          ? `${Math.ceil(data.retryAfter / 60)} 分钟`
          : "稍后";
        setMessage(`请求过于频繁，请 ${retryAfter}后重试`);
      } else {
        setStatus("error");
        setMessage(data.error || "生成失败");
      }
    } catch {
      setStatus("error");
      setMessage("网络错误，请稍后重试");
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className={`
          inline-flex items-center gap-2 px-4 py-2 text-sm rounded-sm border
          transition-all duration-200
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          ${
            status === "loading"
              ? "bg-muted/20 text-muted border-border cursor-wait"
              : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
          }
        `}
      >
        <RefreshCw
          size={14}
          className={status === "loading" ? "animate-spin" : ""}
        />
        {status === "loading" ? "AI 生成中..." : "AI 重新生成"}
      </button>

      {message && (
        <span
          className={`text-xs ${
            status === "success"
              ? "text-[var(--sentiment-positive)]"
              : status === "error" || status === "cooldown"
                ? "text-[var(--sentiment-negative)]"
                : "text-muted"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
