"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PosterContent } from "@/lib/poster-content";
import { buildClassicNewsPoster } from "./templates/classicNewsPoster";
import { buildSundayReviewPoster } from "./templates/sundayReviewPoster";
import type { PosterBuildResult, PretextModule } from "./templates/shared";

type PosterTemplateId = "classic-news" | "sunday-review";

interface PosterPreviewProps {
  content: PosterContent;
}

const TEMPLATE_OPTIONS: Array<{
  id: PosterTemplateId;
  label: string;
  description: string;
}> = [
  {
    id: "classic-news",
    label: "Classic News",
    description: "彩色新闻特稿长图，强调报头、正文分栏和数据边栏。",
  },
  {
    id: "sunday-review",
    label: "Sunday Review",
    description: "黑白评论版长图，强调留白、评论口吻和引文层级。",
  },
];

const DEFAULT_TEMPLATE_ID: PosterTemplateId = "classic-news";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "poster";
}

function isPosterTemplateId(value: string | null): value is PosterTemplateId {
  return value === "classic-news" || value === "sunday-review";
}

function resolveTemplateId(value: string | null): PosterTemplateId {
  return isPosterTemplateId(value) ? value : DEFAULT_TEMPLATE_ID;
}

export default function PosterPreview({ content }: PosterPreviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [templateId, setTemplateId] = useState<PosterTemplateId>(() =>
    resolveTemplateId(searchParams.get("template")),
  );
  const [poster, setPoster] = useState<PosterBuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"svg" | "png" | null>(null);

  const filenameBase = useMemo(
    () => `v2ex-${content.postId}-${templateId}-${slugify(content.title)}`,
    [content.postId, content.title, templateId],
  );

  const activeTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((option) => option.id === templateId) ?? TEMPLATE_OPTIONS[0],
    [templateId],
  );

  useEffect(() => {
    const nextTemplateId = resolveTemplateId(searchParams.get("template"));
    if (nextTemplateId !== templateId) {
      setTemplateId(nextTemplateId);
    }
  }, [searchParams, templateId]);

  const updateTemplateInUrl = useCallback(
    (nextTemplateId: PosterTemplateId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("template", nextTemplateId);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleTemplateChange = useCallback(
    (nextTemplateId: PosterTemplateId) => {
      setTemplateId(nextTemplateId);
      updateTemplateInUrl(nextTemplateId);
    },
    [updateTemplateInUrl],
  );

  useEffect(() => {
    let cancelled = false;

    async function preparePoster() {
      try {
        setError(null);
        setPoster(null);

        const pretext: PretextModule = await import("@chenglou/pretext");

        await Promise.all([
          document.fonts.load('700 58px "Noto Serif SC"', "Poster export"),
          document.fonts.load('700 34px "Playfair Display"', "Poster export"),
          document.fonts.load("500 14px Inter", "Poster export"),
          document.fonts.load('600 12px "JetBrains Mono"', "Poster export"),
        ]);
        await document.fonts.ready;

        if (cancelled) return;

        const nextPoster =
          templateId === "classic-news"
            ? buildClassicNewsPoster(content, pretext)
            : buildSundayReviewPoster(content, pretext);

        if (cancelled) return;
        setPoster(nextPoster);
      } catch (cause) {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : "Failed to build poster";
        setError(message);
      }
    }

    preparePoster();

    return () => {
      cancelled = true;
    };
  }, [content, templateId]);

  async function downloadBlob(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadSvg() {
    if (!poster) return;
    setBusy("svg");
    try {
      await downloadBlob(
        new Blob([poster.svg], {
          type: "image/svg+xml;charset=utf-8",
        }),
        `${filenameBase}.svg`,
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadPng() {
    if (!poster) return;
    setBusy("png");
    try {
      const svgBlob = new Blob([poster.svg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to rasterize SVG"));
        image.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = poster.width * 2;
      canvas.height = poster.height * 2;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D context is unavailable");

      context.scale(2, 2);
      context.fillStyle = poster.background ?? "#ffffff";
      context.fillRect(0, 0, poster.width, poster.height);
      context.drawImage(image, 0, 0, poster.width, poster.height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      URL.revokeObjectURL(url);
      if (!pngBlob) throw new Error("Failed to encode PNG");

      await downloadBlob(pngBlob, `${filenameBase}.png`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-mono-data">
              pretext poster export
            </p>
            <h1 className="font-serif-cn text-2xl md:text-3xl font-bold">
              海报预览
            </h1>
            <p className="text-sm text-muted font-serif-cn leading-relaxed">
              现在这页会并行提供两套长图模板：经典新闻版和黑白评论版。两套模板都基于同一份报告数据，用
              `pretext` 负责长标题、导语、正文和引文排版。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/t/${content.postId}`}
              className="px-4 py-2 text-sm border border-border rounded-sm hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              返回报告
            </Link>
            <button
              onClick={handleDownloadSvg}
              disabled={!poster || busy !== null}
              className="px-4 py-2 text-sm border border-border rounded-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === "svg" ? "导出中..." : "下载 SVG"}
            </button>
            <button
              onClick={handleDownloadPng}
              disabled={!poster || busy !== null}
              className="px-4 py-2 text-sm border border-accent text-accent rounded-sm hover:bg-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === "png" ? "导出中..." : "下载 PNG"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {TEMPLATE_OPTIONS.map((option) => {
            const active = option.id === templateId;
            return (
              <button
                key={option.id}
                onClick={() => handleTemplateChange(option.id)}
                className={`text-left rounded-xl border px-4 py-4 transition-colors ${
                  active
                    ? "border-accent bg-accent/6"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 text-sm text-muted font-serif-cn leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] uppercase tracking-[0.24em] font-mono-data ${
                      active ? "text-accent" : "text-muted"
                    }`}
                  >
                    {active ? "Active" : "Preview"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted font-serif-cn">
          当前模板：<span className="text-foreground font-semibold">{activeTemplate.label}</span>
          <span className="ml-2">{activeTemplate.description}</span>
        </div>

        {error ? (
          <div className="rounded-sm border border-[var(--sentiment-negative)]/30 bg-[var(--sentiment-negative)]/8 px-4 py-3 text-sm text-[var(--sentiment-negative)]">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-card p-3 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)] overflow-auto">
          {poster ? (
            <div
              className="w-full min-w-[320px]"
              dangerouslySetInnerHTML={{ __html: poster.svg }}
            />
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted font-serif-cn">
              正在加载字体并计算海报排版...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
