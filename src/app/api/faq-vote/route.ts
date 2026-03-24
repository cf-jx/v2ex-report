import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTES_FILE = path.join(process.cwd(), "src/data/faq-votes.json");

interface VoteRecord {
  up: number;
  down: number;
}

type VotesData = Record<string, VoteRecord>;

// Simple in-memory rate limit: IP+faqId -> last vote timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

// Clean stale entries periodically to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of rateLimitMap) {
    if (now - ts > RATE_LIMIT_MS) rateLimitMap.delete(key);
  }
}, 60_000);

function readVotes(): VotesData {
  try {
    const raw = readFileSync(VOTES_FILE, "utf-8");
    return JSON.parse(raw) as VotesData;
  } catch {
    return {};
  }
}

function writeVotes(data: VotesData): void {
  writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  let body: { faqId?: string; vote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { faqId, vote } = body;

  if (!faqId || typeof faqId !== "string") {
    return NextResponse.json({ error: "Missing faqId" }, { status: 400 });
  }
  if (vote !== "up" && vote !== "down") {
    return NextResponse.json(
      { error: 'vote must be "up" or "down"' },
      { status: 400 },
    );
  }

  // Rate limit check
  const ip = getClientIP(request);
  const rateKey = `${ip}:${faqId}`;
  const lastVote = rateLimitMap.get(rateKey);
  if (lastVote && Date.now() - lastVote < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Rate limited. Try again later." },
      { status: 429 },
    );
  }

  const votes = readVotes();
  if (!votes[faqId]) {
    votes[faqId] = { up: 0, down: 0 };
  }
  votes[faqId][vote] += 1;
  writeVotes(votes);

  rateLimitMap.set(rateKey, Date.now());

  return NextResponse.json({
    faqId,
    upvotes: votes[faqId].up,
    downvotes: votes[faqId].down,
  });
}
