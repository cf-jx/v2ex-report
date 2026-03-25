import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { saveLikes, loadLikes } from "@/lib/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface LikeData {
  count: number;
  ips: string[];
}

const BUNDLED_LIKE = join(/*turbopackIgnore: true*/ process.cwd(), "src/data/likes.json");

async function readLikes(postId: string): Promise<LikeData> {
  // Try Blob first
  try {
    const blob = await loadLikes(postId);
    if (blob) return blob;
  } catch {
    // fall through
  }

  // Fallback to bundled (only for default post)
  if (postId === "1200385" && existsSync(BUNDLED_LIKE)) {
    try {
      return JSON.parse(readFileSync(BUNDLED_LIKE, "utf-8")) as LikeData;
    } catch {
      // fall through
    }
  }

  return { count: 0, ips: [] };
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId") || "1200385";
  const data = await readLikes(postId);
  return NextResponse.json({ count: data.count });
}

export async function POST(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId") || "1200385";
  const ip = getClientIP(request);
  const data = await readLikes(postId);

  if (data.ips.includes(ip)) {
    return NextResponse.json(
      { error: "Already liked", count: data.count, liked: true },
      { status: 409 },
    );
  }

  data.count += 1;
  data.ips.push(ip);
  await saveLikes(postId, data);

  return NextResponse.json({ count: data.count, liked: true });
}
