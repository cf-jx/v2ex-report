import type { PosterContent } from "@/lib/poster-content";
import {
  escapeXml,
  layoutColumnFlow,
  layoutText,
  renderRect,
  renderRule,
  renderTextLines,
  type PosterBuildResult,
  type PretextModule,
} from "./shared";

const WIDTH = 1180;
const PAGE_PADDING = 64;
const CONTENT_WIDTH = WIDTH - PAGE_PADDING * 2;
const MAIN_WIDTH = 640;
const RAIL_GAP = 44;
const RAIL_WIDTH = CONTENT_WIDTH - MAIN_WIDTH - RAIL_GAP;
const MAIN_X = PAGE_PADDING;
const RAIL_X = MAIN_X + MAIN_WIDTH + RAIL_GAP;

const COLORS = {
  background: "#f7f6f1",
  paper: "#fbfaf6",
  foreground: "#111111",
  muted: "#666666",
  border: "#bdb7ab",
  wash: "#efede6",
  shadow: "#dfdbd1",
} as const;

const FONTS = {
  title: '700 58px "Noto Serif SC"',
  deck: '400 24px "Noto Serif SC"',
  body: '400 20px "Noto Serif SC"',
  quote: 'italic 400 28px "Noto Serif SC"',
  railTitle: '700 18px "Playfair Display"',
  railBody: "400 14px Inter",
  mono: '600 12px "JetBrains Mono"',
} as const;

function buildReviewNarrative(content: PosterContent): string[] {
  const topicLead = content.topics.slice(0, 2).map((topic) => topic.name).join("、");
  const strongestVoice = content.voices[0];
  return [
    `如果把这条帖子当成一篇评论版特稿来读，它的核心其实并不在技巧本身，而在一整套围绕${topicLead}展开的民间经验如何被不断修正、补充和校验。`,
    `${content.summary} 这类线程的价值，在于它既像教程，也像社群自发形成的勘误表。`,
    strongestVoice
      ? `最活跃的发言者是 ${strongestVoice.name}${strongestVoice.isOP ? "（OP）" : ""}。当一个声音持续回到线程中央，整场讨论就会自然形成评论版式的主叙事，而非散乱的信息堆叠。`
      : "讨论的节奏决定了它更适合被排成评论版长图：留白更大、节奏更慢、每一段都允许读者停顿。",
    ...content.takeaways.slice(0, 2).map((item) => `${item.title}。${item.body}`),
  ];
}

function renderFlowLines(result: ReturnType<typeof layoutColumnFlow>): string {
  return result.lines
    .map((line) => {
      if (!line.text) return "";
      return `<text x="${line.x}" y="${line.y}" fill="${COLORS.foreground}" font-family="Noto Serif SC" font-size="20" xml:space="preserve">${escapeXml(line.text)}</text>`;
    })
    .join("");
}

function monoMeter(label: string, value: string, x: number, y: number): string {
  return `
    <text x="${x}" y="${y}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.1">${escapeXml(label.toUpperCase())}</text>
    <text x="${x}" y="${y + 26}" fill="${COLORS.foreground}" font-family="Playfair Display" font-size="28" font-weight="700">${escapeXml(value)}</text>
  `;
}

export function buildSundayReviewPoster(
  content: PosterContent,
  pretext: PretextModule,
): PosterBuildResult {
  const headline = layoutText(pretext, content.title, FONTS.title, CONTENT_WIDTH - 140, 74);
  const deck = layoutText(pretext, content.summary, FONTS.deck, CONTENT_WIDTH - 220, 38);
  const narrative = buildReviewNarrative(content);
  const bodyText = narrative.join("\n\n");
  const columns = [
    { x: MAIN_X, y: 0, width: (MAIN_WIDTH - 26) / 2, height: 1400, lineHeight: 32 },
    { x: MAIN_X + (MAIN_WIDTH - 26) / 2 + 26, y: 0, width: (MAIN_WIDTH - 26) / 2, height: 1400, lineHeight: 32 },
  ];

  const quoteText = content.quotes[1]?.body ?? content.quotes[0]?.body ?? content.summary;
  const quoteBlock = layoutText(pretext, quoteText, FONTS.quote, RAIL_WIDTH - 34, 42);
  const reviewNote = layoutText(
    pretext,
    "A quieter version of the same report: less graphic noise, more editorial pacing, more room for interpretation.",
    FONTS.railBody,
    RAIL_WIDTH - 12,
    24,
  );

  let y = 64;
  const mastheadY = y;
  y += 30;
  const issueY = y;
  y += 18;
  const topRuleY = y + 6;
  y += 28;
  const titleY = y + 54;
  y += headline.height + 24;
  const deckY = y + 24;
  y += deck.height + 30;
  const bylineY = y;
  y += 36;

  const quotePanelY = y;
  const quotePanelHeight = quoteBlock.height + 146;
  const bodyTop = y;
  const bodyColumnsTop = bodyTop + 18;
  const flowed = layoutColumnFlow(pretext, bodyText, FONTS.body, columns.map((column) => ({ ...column, y: bodyColumnsTop })), {
    whiteSpace: "pre-wrap",
  });
  const bodyBottom = bodyColumnsTop + flowed.height;

  let railY = quotePanelY + 26;
  const railLabelY = railY;
  railY += 34;
  const railNoteY = railY + 16;
  railY += reviewNote.height + 30;

  const quoteTitleY = railY;
  railY += 18;
  const quoteBodyY = railY + 34;
  railY += quoteBlock.height + 56;

  const metricsY = railY;
  const metricsHeight = 178;
  railY += metricsHeight + 26;

  const topicBlock = layoutText(
    pretext,
    content.topics.slice(0, 4).map((topic) => `${topic.name} · ${topic.count}`).join("\n"),
    FONTS.railBody,
    RAIL_WIDTH - 12,
    26,
  );
  const topicY = railY;
  railY += topicBlock.height + 24;

  const closingText = layoutText(
    pretext,
    "Sunday Review keeps the same data but changes the reading contract: less dashboard, more essay, more time for the argument to breathe.",
    FONTS.deck,
    CONTENT_WIDTH - 100,
    34,
  );

  const articleBottom = Math.max(bodyBottom + 22, railY + 16, quotePanelY + quotePanelHeight);
  const closingRuleY = articleBottom + 26;
  const closingLabelY = closingRuleY + 20;
  const closingBodyY = closingLabelY + 24;
  const footerY = closingBodyY + closingText.height + 38;
  const height = footerY + 42;

  return {
    width: WIDTH,
    height,
    background: COLORS.background,
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="Sunday Review poster">
  <defs>
    <pattern id="mono-grid" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M 9 0 L 0 0 0 9" fill="none" stroke="#ebe8df" stroke-width="0.45" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${height}" fill="${COLORS.background}" />
  <rect width="${WIDTH}" height="${height}" fill="url(#mono-grid)" opacity="0.55" />
  <rect x="24" y="24" width="${WIDTH - 48}" height="${height - 48}" fill="none" stroke="${COLORS.border}" stroke-width="1.1" />
  <rect x="36" y="36" width="${WIDTH - 72}" height="${height - 72}" fill="none" stroke="${COLORS.border}" stroke-width="0.75" />

  <text x="${WIDTH / 2}" y="${mastheadY}" fill="${COLORS.foreground}" font-family="Playfair Display" font-size="30" font-weight="700" text-anchor="middle">SUNDAY REVIEW</text>
  <text x="${PAGE_PADDING}" y="${issueY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.2">V2EX COMMENTARY EDITION</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${issueY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.2" text-anchor="end">${escapeXml(content.postId)}</text>
  ${renderRule(PAGE_PADDING, topRuleY, CONTENT_WIDTH, COLORS.foreground, 1.2)}
  ${renderRule(PAGE_PADDING, topRuleY + 5, CONTENT_WIDTH, COLORS.border, 0.9)}

  ${renderTextLines(headline, PAGE_PADDING + 70, titleY, '"Noto Serif SC"', 58, COLORS.foreground, { width: CONTENT_WIDTH - 140, align: "center", fontWeight: 700 })}
  ${renderTextLines(deck, PAGE_PADDING + 110, deckY, '"Noto Serif SC"', 24, COLORS.muted, { width: CONTENT_WIDTH - 220, align: "center" })}
  <text x="${PAGE_PADDING}" y="${bylineY}" fill="${COLORS.foreground}" font-family="Inter" font-size="13" font-weight="600">By ${escapeXml(content.author)}</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${bylineY}" fill="${COLORS.muted}" font-family="Inter" font-size="13" font-weight="500" text-anchor="end">Updated ${escapeXml(content.lastUpdated)} · Sunday Review Variant</text>

  <line x1="${RAIL_X - RAIL_GAP / 2}" y1="${bodyTop}" x2="${RAIL_X - RAIL_GAP / 2}" y2="${articleBottom}" stroke="${COLORS.border}" stroke-width="1" />
  ${renderRect(RAIL_X, quotePanelY, RAIL_WIDTH, articleBottom - quotePanelY, { fill: COLORS.wash, opacity: 0.72 })}

  <text x="${MAIN_X}" y="${bodyTop - 10}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.1">ESSAY</text>
  ${renderFlowLines(flowed)}

  <text x="${RAIL_X}" y="${railLabelY}" fill="${COLORS.foreground}" font-family="Playfair Display" font-size="18" font-weight="700">Editor&apos;s Note</text>
  ${renderTextLines(reviewNote, RAIL_X, railNoteY, 'Inter', 14, COLORS.muted)}

  <text x="${RAIL_X}" y="${quoteTitleY}" fill="${COLORS.foreground}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.1">QUOTE OF THE WEEK</text>
  <text x="${RAIL_X + 10}" y="${quoteBodyY - 8}" fill="${COLORS.foreground}" font-family="Playfair Display" font-size="64" font-weight="700">“</text>
  ${renderTextLines(quoteBlock, RAIL_X + 28, quoteBodyY, '"Noto Serif SC"', 28, COLORS.foreground, { fontStyle: "italic" })}
  <text x="${RAIL_X + 28}" y="${quoteBodyY + quoteBlock.height + 18}" fill="${COLORS.muted}" font-family="Inter" font-size="12" font-weight="700">— ${escapeXml(content.quotes[1]?.author ?? content.quotes[0]?.author ?? content.author)}</text>

  ${renderRect(RAIL_X, metricsY, RAIL_WIDTH, metricsHeight, { fill: COLORS.paper, stroke: COLORS.border, strokeWidth: 1 })}
  ${monoMeter("Replies", content.stats[0]?.value ?? "0", RAIL_X + 18, metricsY + 30)}
  ${monoMeter("Commenters", content.stats[1]?.value ?? "0", RAIL_X + 18, metricsY + 84)}
  ${monoMeter("Views", content.stats[2]?.value ?? "0", RAIL_X + 18, metricsY + 138)}
  <line x1="${RAIL_X + RAIL_WIDTH / 2}" y1="${metricsY + 18}" x2="${RAIL_X + RAIL_WIDTH / 2}" y2="${metricsY + metricsHeight - 18}" stroke="${COLORS.border}" stroke-width="1" />
  ${monoMeter("OP Reply Rate", content.stats[3]?.value ?? "0%", RAIL_X + RAIL_WIDTH / 2 + 18, metricsY + 30)}
  ${monoMeter("Positive", `${content.sentiment.positive}`, RAIL_X + RAIL_WIDTH / 2 + 18, metricsY + 84)}
  ${monoMeter("Negative", `${content.sentiment.negative}`, RAIL_X + RAIL_WIDTH / 2 + 18, metricsY + 138)}

  <text x="${RAIL_X}" y="${topicY - 8}" fill="${COLORS.foreground}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.1">THREAD INDEX</text>
  ${renderTextLines(topicBlock, RAIL_X, topicY + 18, 'Inter', 14, COLORS.foreground)}

  ${renderRule(PAGE_PADDING, closingRuleY, CONTENT_WIDTH, COLORS.foreground, 1.2)}
  <text x="${PAGE_PADDING}" y="${closingLabelY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="11" font-weight="700" letter-spacing="1.1">AFTERWORD</text>
  ${renderTextLines(closingText, PAGE_PADDING + 50, closingBodyY, '"Noto Serif SC"', 24, COLORS.foreground, { width: CONTENT_WIDTH - 100, align: "center", fontStyle: "italic" })}

  <text x="${PAGE_PADDING}" y="${footerY}" fill="${COLORS.muted}" font-family="Inter" font-size="12">Black-and-white review template powered by pretext</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${footerY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" text-anchor="end">Sunday Review / ${escapeXml(content.postId)}</text>
</svg>`.trim(),
  };
}
