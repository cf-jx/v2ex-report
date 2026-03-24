import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Use /tmp on Vercel (read-only filesystem), fallback to local in dev
const STATS_FILE = path.join("/tmp", "stats.json");
const BUNDLED_STATS = path.join(process.cwd(), "src/data/stats.json");

interface StatsData {
  visitors: number;
  lastReset: string;
}

function readStats(): StatsData {
  try {
    const raw = readFileSync(STATS_FILE, "utf-8");
    return JSON.parse(raw) as StatsData;
  } catch {
    // Try bundled stats as seed
    try {
      const raw = readFileSync(BUNDLED_STATS, "utf-8");
      return JSON.parse(raw) as StatsData;
    } catch {
      return { visitors: 0, lastReset: new Date().toISOString().slice(0, 10) };
    }
  }
}

function writeStats(data: StatsData): void {
  writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const stats = readStats();
  return NextResponse.json({ visitors: stats.visitors });
}

export async function POST() {
  const stats = readStats();
  stats.visitors += 1;
  writeStats(stats);
  return NextResponse.json({ visitors: stats.visitors });
}
