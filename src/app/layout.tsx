import type { Metadata } from "next";
import {
  Playfair_Display,
  Noto_Serif_SC,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://v2ex-report.vercel.app";

export const metadata: Metadata = {
  title: "The V2EX Chronicle",
  description:
    "V2EX 热门帖子评论可视化分析报告，包含情感分析、话题分布、活跃用户排行与 AI 摘要",
  keywords: ["V2EX", "评论分析", "数据可视化", "AI 摘要", "情感分析"],
  openGraph: {
    title: "The V2EX Chronicle",
    description:
      "V2EX 热门帖子评论可视化分析报告，包含情感分析、话题分布、活跃用户排行与 AI 摘要",
    url: siteUrl,
    siteName: "The V2EX Chronicle",
    locale: "zh_CN",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The V2EX Chronicle",
    description:
      "V2EX 热门帖子评论可视化分析报告，包含情感分析、话题分布与 AI 摘要",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${playfairDisplay.variable} ${notoSerifSC.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
