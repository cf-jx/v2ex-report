import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIKE_FILE = join("/tmp", "likes.json");
const BUNDLED_LIKE = join(process.cwd(), "src/data/likes.json");

interface LikeData {
  count: number;
  ips: string[]; // deduplicate by IP
}

function readLikes(): LikeData {
  try {
    return JSON.parse(readFileSync(LIKE_FILE, "utf-8")) as LikeData;
  } catch {
    try {
      return JSON.parse(readFileSync(BUNDLED_LIKE, "utf-8")) as LikeData;
    } catch {
      return { count: 0, ips: [] };
    }
  }
}

function writeLikes(data: LikeData): void {
  writeFileSync(LIKE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET() {
  const data = readLikes();
  return NextResponse.json({ count: data.count });
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const data = readLikes();

  // Check if already liked
  if (data.ips.includes(ip)) {
    return NextResponse.json(
      { error: "Already liked", count: data.count, liked: true },
      { status: 409 },
    );
  }

  data.count += 1;
  data.ips.push(ip);
  writeLikes(data);

  return NextResponse.json({ count: data.count, liked: true });
}
