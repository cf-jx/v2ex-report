import type { Metadata } from "next";
import {
  Playfair_Display,
  Noto_Serif_SC,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
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

export const metadata: Metadata = {
  title: "The V2EX Chronicle",
  description: "V2EX comment visualization report in newspaper editorial style",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
