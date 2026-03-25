"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { parseV2EXUrl } from "@/lib/url";

export default function URLInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const postId = parseV2EXUrl(value);
    if (!postId) {
      setError("请输入有效的 V2EX 链接或帖子 ID");
      return;
    }

    router.push(`/t/${postId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="输入 V2EX 帖子链接或帖子 ID 进行分析..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg
                     placeholder:text-muted/60 text-foreground
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50
                     transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg
                   hover:bg-accent/90 active:bg-accent/80 transition-colors flex-shrink-0"
      >
        分析
      </button>
      {error && (
        <p className="absolute mt-12 text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
