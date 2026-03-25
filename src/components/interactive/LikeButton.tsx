"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const storageKey = `v2ex-report-liked-${postId}`;

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "1") {
      setLiked(true);
    }
    fetch(`/api/like?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, [postId, storageKey]);

  const handleLike = async () => {
    if (liked) return;

    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    try {
      const res = await fetch(`/api/like?postId=${postId}`, { method: "POST" });
      const data = await res.json();

      if (res.ok || res.status === 409) {
        setCount(data.count);
        setLiked(true);
        localStorage.setItem(storageKey, "1");
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`
        inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm
        transition-all duration-300 select-none
        ${
          liked
            ? "bg-accent/10 border-accent text-accent cursor-default"
            : "bg-card border-border text-muted hover:border-accent hover:text-accent cursor-pointer"
        }
      `}
      aria-label={liked ? "Already liked" : "Like this report"}
    >
      <Heart
        size={18}
        className={`
          transition-all duration-300
          ${liked ? "fill-accent text-accent" : ""}
          ${animating ? "scale-125" : "scale-100"}
        `}
        style={animating ? { transform: "scale(1.3)", transition: "transform 0.3s ease" } : undefined}
      />
      <span className="font-serif-cn">{liked ? "已点赞" : "点赞"}</span>
      <span className="font-mono-data text-xs">({count})</span>
    </button>
  );
}
