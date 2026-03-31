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

const WIDTH = 1240;
const HEIGHT_PADDING = 58;
const PAGE_PADDING = 58;
const CONTENT_WIDTH = WIDTH - PAGE_PADDING * 2;
const RAIL_WIDTH = 290;
const SECTION_GAP = 38;
const ARTICLE_WIDTH = CONTENT_WIDTH - RAIL_WIDTH - SECTION_GAP;
const ARTICLE_X = PAGE_PADDING;
const RAIL_X = ARTICLE_X + ARTICLE_WIDTH + SECTION_GAP;
const COLUMN_GAP = 24;
const COLUMN_SPECS = [
  { width: 344, flex: 1.32 },
  { width: 188, flex: 0.72 },
  { width: 220, flex: 0.84 },
] as const;

const COLORS = {
  background: "#f6f0e4",
  paper: "#fbf7f0",
  paperSoft: "#f0e7d8",
  foreground: "#111111",
  muted: "#6f665c",
  accent: "#9e1b1b",
  rule: "#cabda9",
  ruleDark: "#8c7f73",
  positive: "#2f6b60",
  neutral: "#bc9130",
  negative: "#b16249",
} as const;

const FONTS = {
  title: '700 56px "Noto Serif SC"',
  deck: '400 24px "Noto Serif SC"',
  body: '400 19px "Noto Serif SC"',
  quote: '400 26px "Noto Serif SC"',
  railBody: "400 14px Inter",
  railTitle: "700 17px Inter",
  noteTitle: '700 21px "Noto Serif SC"',
  noteBody: '400 16px "Noto Serif SC"',
} as const;

function buildNarrative(content: PosterContent): string[] {
  const topicLead = content.topics.slice(0, 3).map((topic) => `${topic.name}（${topic.count}）`).join("、");
  const voiceLead = content.voices
    .slice(0, 3)
    .map((voice) => `${voice.name}${voice.isOP ? "（OP）" : ""} ${voice.count} 次`)
    .join("、");
  const sentimentTotal =
    content.sentiment.positive + content.sentiment.neutral + content.sentiment.negative || 1;

  return [
    `${content.summary} 这张海报把原帖讨论重排成更接近报纸特稿的阅读顺序：先结论，后证据，再回到代表性发言。`,
    `从主题分布看，${topicLead}构成了讨论主干。整场对话并不是松散发散的，而是在订阅路径、风控经验和替代方案之间反复折返。`,
    `情绪分布上，积极 ${Math.round((content.sentiment.positive / sentimentTotal) * 100)}% 、中立 ${Math.round((content.sentiment.neutral / sentimentTotal) * 100)}% 、消极 ${Math.round((content.sentiment.negative / sentimentTotal) * 100)}% 。线程整体更像经验整理，而不是单纯的情绪宣泄。`,
    `最活跃的发言者中，${voiceLead}最能左右讨论的叙事中心；而高频问题和评论摘录，则把这场讨论反复被追问的细节钉在了页面上。`,
    ...content.takeaways.slice(0, 2).map((item) => `${item.title}。${item.body}`),
  ];
}

function renderFlowLines(result: ReturnType<typeof layoutColumnFlow>, fontSize: number, fill: string): string {
  return result.lines
    .map((line) => {
      if (!line.text) return "";
      return `<text x="${line.x}" y="${line.y}" fill="${fill}" font-family="Noto Serif SC" font-size="${fontSize}" xml:space="preserve">${escapeXml(line.text)}</text>`;
    })
    .join("");
}

function renderBarRow(label: string, value: number, maxValue: number, x: number, y: number, width: number, color: string): string {
  const barWidth = maxValue > 0 ? (value / maxValue) * width : 0;
  return `
    <text x="${x}" y="${y}" fill="${COLORS.foreground}" font-family="Inter" font-size="13" font-weight="600">${escapeXml(label)}</text>
    <rect x="${x + 108}" y="${y - 10}" width="${width}" height="8" rx="4" fill="#e6dccd" />
    <rect x="${x + 108}" y="${y - 10}" width="${barWidth}" height="8" rx="4" fill="${color}" />
    <text x="${x + 108 + width}" y="${y}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" text-anchor="end">${value}</text>
  `;
}

export function buildClassicNewsPoster(
  content: PosterContent,
  pretext: PretextModule,
): PosterBuildResult {
  const narrative = buildNarrative(content);
  const leadParagraph = narrative[0] ?? content.summary;
  const leadDropCap = leadParagraph.slice(0, 1);
  const leadBody = layoutText(pretext, leadParagraph.slice(1).trimStart(), FONTS.body, ARTICLE_WIDTH - 108, 32);
  const headline = layoutText(pretext, content.title, FONTS.title, ARTICLE_WIDTH + RAIL_WIDTH - 80, 72);
  const deck = layoutText(pretext, content.summary, FONTS.deck, ARTICLE_WIDTH + RAIL_WIDTH - 120, 38);

  const noteCards = content.takeaways.slice(0, 2).map((takeaway) => ({
    title: layoutText(pretext, takeaway.title, FONTS.noteTitle, RAIL_WIDTH - 36, 30),
    body: layoutText(pretext, takeaway.body, FONTS.noteBody, RAIL_WIDTH - 36, 26),
  }));
  const leadQuoteText = content.quotes[0]?.body ?? content.summary;
  const leadQuote = layoutText(pretext, leadQuoteText, FONTS.quote, ARTICLE_WIDTH - 120, 40);
  const leadQuoteAuthor = content.quotes[0]?.author ?? content.author;

  let y = HEIGHT_PADDING;
  const mastheadY = y;
  y += 34;
  const issueY = y;
  y += 20;
  const topRuleY = y;
  y += 26;
  const kickerY = y;
  y += 22;
  const titleY = y + 54;
  y += headline.height + 20;
  const deckY = y + 24;
  y += deck.height + 26;
  const bylineY = y;
  y += 26;
  const statY = y;
  const statHeight = 118;
  y += statHeight + 36;

  const leadTop = y;
  const leadDropY = leadTop + 74;
  const leadBodyY = leadTop + 28;
  const leadHeight = Math.max(160, leadBody.height + 26);

  const pullQuoteY = leadTop + leadHeight + 24;
  const pullQuoteHeight = leadQuote.height + 92;

  const flowTop = pullQuoteY + pullQuoteHeight + 28;
  const unevenWidths = COLUMN_SPECS.map((spec) => spec.width);
  const flowColumns = [
    { x: ARTICLE_X, y: flowTop + 24, width: unevenWidths[0], height: 1120, lineHeight: 32 },
    { x: ARTICLE_X + unevenWidths[0] + COLUMN_GAP, y: flowTop + 24, width: unevenWidths[1], height: 1120, lineHeight: 32 },
    {
      x: ARTICLE_X + unevenWidths[0] + COLUMN_GAP + unevenWidths[1] + COLUMN_GAP,
      y: flowTop + 24,
      width: unevenWidths[2],
      height: 1120,
      lineHeight: 32,
    },
  ];

  const flowNarrative = [
    ...narrative.slice(1, 3),
    ...content.quotes.slice(0, 1).map((quote) => `${quote.author} 说：${quote.body}`),
    ...narrative.slice(3),
  ].join("\n\n");
  const flowed = layoutColumnFlow(pretext, flowNarrative, FONTS.body, flowColumns, {
    whiteSpace: "pre-wrap",
  });
  const flowBottom = flowTop + 24 + flowed.height;

  let railY = leadTop;
  const railHeaderY = railY;
  railY += 28;
  const railIntro = layoutText(
    pretext,
    "A newspaper-style digest for dense threads: headline, editorial flow, data rail, and annotated questions in one export.",
    FONTS.railBody,
    RAIL_WIDTH - 6,
    24,
  );
  const railIntroY = railY + 18;
  railY += railIntro.height + 26;

  const railStatsY = railY;
  const railStatsHeight = 214;
  railY += railStatsHeight + 24;

  const topicsY = railY;
  const topicsHeight = content.topics.length * 28 + 28;
  railY += topicsHeight + 26;

  const sentimentY = railY;
  const sentimentHeight = 120;
  railY += sentimentHeight + 26;

  const voicesY = railY;
  const voicesHeight = content.voices.slice(0, 4).length * 28 + 28;
  railY += voicesHeight + 28;

  const notesY = railY;
  const notesHeight = noteCards.reduce((acc, card) => acc + 34 + card.title.height + 14 + card.body.height + 22, 0) + Math.max(0, noteCards.length - 1) * 14;
  railY += notesHeight + 18;

  const articleBottom = Math.max(flowBottom, railY);
  const closingRuleY = articleBottom + 34;
  const closingLabelY = closingRuleY + 20;
  const closingText = layoutText(
    pretext,
    "The original thread remains the source of record. This poster is a designed digest: same argument, tighter hierarchy, cleaner pacing.",
    FONTS.deck,
    CONTENT_WIDTH - 100,
    34,
  );
  const closingTextY = closingLabelY + 24;
  const footerY = closingTextY + closingText.height + 40;
  const height = footerY + 42;

  const statCards = [
    { label: "Replies", value: content.stats[0]?.value ?? "0" },
    { label: "Commenters", value: content.stats[1]?.value ?? "0" },
    { label: "Views", value: content.stats[2]?.value ?? "0" },
    { label: "OP Reply Rate", value: content.stats[3]?.value ?? "0%" },
  ];
  const topicMax = Math.max(...content.topics.map((topic) => topic.count), 1);
  const voiceMax = Math.max(...content.voices.map((voice) => voice.count), 1);
  const sentimentTotal = content.sentiment.positive + content.sentiment.neutral + content.sentiment.negative || 1;

  return {
    width: WIDTH,
    height,
    background: COLORS.background,
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="Classic newspaper poster">
  <defs>
    <pattern id="news-grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e7decf" stroke-width="0.45" opacity="0.42" />
    </pattern>
    <linearGradient id="paper-wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3ecdf" />
      <stop offset="100%" stop-color="#fbf7f0" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${height}" fill="${COLORS.background}" />
  <rect width="${WIDTH}" height="240" fill="url(#paper-wash)" />
  <rect width="${WIDTH}" height="${height}" fill="url(#news-grid)" opacity="0.7" />
  <rect x="22" y="22" width="${WIDTH - 44}" height="${height - 44}" fill="none" stroke="${COLORS.rule}" stroke-width="1.1" />
  <rect x="34" y="34" width="${WIDTH - 68}" height="${height - 68}" fill="none" stroke="${COLORS.rule}" stroke-width="0.75" />

  <text x="${WIDTH / 2}" y="${mastheadY}" fill="${COLORS.foreground}" font-family="Playfair Display" font-size="34" font-weight="700" text-anchor="middle">THE V2EX CHRONICLE</text>
  <text x="${PAGE_PADDING}" y="${issueY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" font-weight="600">VOL. 01</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${issueY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" font-weight="600" text-anchor="end">POSTER EDITION / ${escapeXml(content.postId)}</text>
  ${renderRule(PAGE_PADDING, topRuleY, CONTENT_WIDTH, COLORS.ruleDark, 1.35)}
  ${renderRule(PAGE_PADDING, topRuleY + 6, CONTENT_WIDTH, COLORS.rule, 1)}

  <text x="${PAGE_PADDING}" y="${kickerY}" fill="${COLORS.accent}" font-family="JetBrains Mono" font-size="12" font-weight="700" letter-spacing="1.2">THREAD ANALYSIS / EDITORIAL LAYOUT / PRETEXT EXPORT</text>
  ${renderTextLines(headline, PAGE_PADDING + 40, titleY, '"Noto Serif SC"', 56, COLORS.foreground, { width: CONTENT_WIDTH - 80, align: "center", fontWeight: 700 })}
  ${renderTextLines(deck, PAGE_PADDING + 60, deckY, '"Noto Serif SC"', 24, COLORS.muted, { width: CONTENT_WIDTH - 120, align: "center" })}
  <text x="${PAGE_PADDING}" y="${bylineY}" fill="${COLORS.foreground}" font-family="Inter" font-size="14" font-weight="600">By ${escapeXml(content.author)}</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${bylineY}" fill="${COLORS.muted}" font-family="Inter" font-size="14" font-weight="500" text-anchor="end">Updated ${escapeXml(content.lastUpdated)} · Source ${escapeXml(content.url)}</text>

  ${renderRect(PAGE_PADDING, statY, CONTENT_WIDTH, statHeight, { fill: COLORS.paper, stroke: COLORS.ruleDark, strokeWidth: 1.1 })}
  ${statCards
    .map((stat, index) => {
      const sectionWidth = CONTENT_WIDTH / statCards.length;
      const sectionX = PAGE_PADDING + sectionWidth * index;
      return `
        ${index > 0 ? `<line x1="${sectionX}" y1="${statY + 16}" x2="${sectionX}" y2="${statY + statHeight - 16}" stroke="${COLORS.rule}" stroke-width="1" />` : ""}
        <text x="${sectionX + sectionWidth / 2}" y="${statY + 50}" fill="${COLORS.foreground}" font-family="JetBrains Mono" font-size="34" font-weight="700" text-anchor="middle">${escapeXml(stat.value)}</text>
        <text x="${sectionX + sectionWidth / 2}" y="${statY + 80}" fill="${COLORS.muted}" font-family="Inter" font-size="11" font-weight="700" letter-spacing="1.4" text-anchor="middle">${escapeXml(stat.label.toUpperCase())}</text>
      `;
    })
    .join("")}

  <line x1="${RAIL_X - SECTION_GAP / 2}" y1="${leadTop - 10}" x2="${RAIL_X - SECTION_GAP / 2}" y2="${articleBottom}" stroke="${COLORS.rule}" stroke-width="1" />
  ${renderRect(RAIL_X, leadTop - 12, RAIL_WIDTH, articleBottom - leadTop + 24, { fill: COLORS.paperSoft, opacity: 0.62 })}

  <text x="${ARTICLE_X}" y="${leadTop - 14}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" font-weight="700">LEAD STORY</text>
  <text x="${ARTICLE_X}" y="${leadTop + 8}" fill="${COLORS.accent}" font-family="JetBrains Mono" font-size="12" font-weight="700">LEAD</text>
  <text x="${ARTICLE_X}" y="${leadDropY}" fill="${COLORS.foreground}" font-family="Noto Serif SC" font-size="86" font-weight="700">${escapeXml(leadDropCap)}</text>
  ${renderTextLines(leadBody, ARTICLE_X + 68, leadBodyY + 26, '"Noto Serif SC"', 19, COLORS.foreground)}

  <text x="${ARTICLE_X}" y="${pullQuoteY - 12}" fill="${COLORS.accent}" font-family="JetBrains Mono" font-size="12" font-weight="700">PULL QUOTE</text>
  ${renderRect(ARTICLE_X, pullQuoteY, ARTICLE_WIDTH, pullQuoteHeight, { fill: COLORS.paper, stroke: COLORS.ruleDark, strokeWidth: 1, rx: 6 })}
  <text x="${ARTICLE_X + 26}" y="${pullQuoteY + 62}" fill="${COLORS.accent}" font-family="Playfair Display" font-size="72" font-weight="700">“</text>
  ${renderTextLines(leadQuote, ARTICLE_X + 82, pullQuoteY + 78, '"Noto Serif SC"', 26, COLORS.foreground, { width: ARTICLE_WIDTH - 164, align: "center" })}
  <text x="${ARTICLE_X + ARTICLE_WIDTH / 2}" y="${pullQuoteY + pullQuoteHeight - 22}" fill="${COLORS.muted}" font-family="Inter" font-size="13" font-weight="600" text-anchor="middle">— ${escapeXml(leadQuoteAuthor)}</text>

  <text x="${ARTICLE_X}" y="${flowTop - 12}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="12" font-weight="700">UNEVEN THREE-COLUMN FLOW</text>
  ${renderFlowLines(flowed, 19, COLORS.foreground)}

  <text x="${RAIL_X}" y="${railHeaderY}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">News Desk</text>
  ${renderTextLines(railIntro, RAIL_X, railIntroY, 'Inter', 14, COLORS.muted)}

  <text x="${RAIL_X}" y="${railStatsY - 10}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">At A Glance</text>
  ${statCards
    .map((stat, index) => {
      const itemY = railStatsY + 24 + index * 46;
      return `
        <text x="${RAIL_X}" y="${itemY}" fill="${COLORS.foreground}" font-family="JetBrains Mono" font-size="28" font-weight="700">${escapeXml(stat.value)}</text>
        <text x="${RAIL_X}" y="${itemY + 18}" fill="${COLORS.muted}" font-family="Inter" font-size="12" font-weight="600">${escapeXml(stat.label)}</text>
        ${index < statCards.length - 1 ? `<line x1="${RAIL_X}" y1="${itemY + 30}" x2="${RAIL_X + RAIL_WIDTH}" y2="${itemY + 30}" stroke="${COLORS.rule}" stroke-width="1" />` : ""}
      `;
    })
    .join("")}

  <text x="${RAIL_X}" y="${topicsY - 10}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">Topic Mix</text>
  ${content.topics.map((topic, index) => renderBarRow(topic.name, topic.count, topicMax, RAIL_X, topicsY + 18 + index * 28, RAIL_WIDTH - 126, index % 2 === 0 ? COLORS.positive : COLORS.neutral)).join("")}

  <text x="${RAIL_X}" y="${sentimentY - 10}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">Sentiment Ledger</text>
  ${[
    ["Positive", content.sentiment.positive, COLORS.positive],
    ["Neutral", content.sentiment.neutral, COLORS.neutral],
    ["Negative", content.sentiment.negative, COLORS.negative],
  ].map(([label, value, color], index) => {
      const rowY = sentimentY + 18 + index * 30;
      const barWidth = ((RAIL_WIDTH - 132) * Number(value)) / sentimentTotal;
      const pct = Math.round((Number(value) / sentimentTotal) * 100);
      return `
        <text x="${RAIL_X}" y="${rowY}" fill="${COLORS.muted}" font-family="Inter" font-size="13" font-weight="600">${label}</text>
        <rect x="${RAIL_X + 92}" y="${rowY - 10}" width="${RAIL_WIDTH - 132}" height="8" rx="4" fill="#e6dccd" />
        <rect x="${RAIL_X + 92}" y="${rowY - 10}" width="${barWidth}" height="8" rx="4" fill="${color}" />
        <text x="${RAIL_X + RAIL_WIDTH}" y="${rowY}" fill="${COLORS.foreground}" font-family="JetBrains Mono" font-size="12" text-anchor="end">${value} / ${pct}%</text>
      `;
    }).join("")}

  <text x="${RAIL_X}" y="${voicesY - 10}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">Most Active Voices</text>
  ${content.voices.slice(0, 4).map((voice, index) => renderBarRow(`${voice.name}${voice.isOP ? " · OP" : ""}`, voice.count, voiceMax, RAIL_X, voicesY + 18 + index * 28, RAIL_WIDTH - 126, voice.isOP ? COLORS.accent : COLORS.foreground)).join("")}

  <text x="${RAIL_X}" y="${notesY - 10}" fill="${COLORS.foreground}" font-family="Inter" font-size="17" font-weight="700">Editor Notes</text>
  ${(() => {
    let noteY = notesY + 10;
    return noteCards.map((card) => {
      const cardHeight = 34 + card.title.height + 14 + card.body.height + 22;
      const svg = `
        ${renderRect(RAIL_X, noteY, RAIL_WIDTH, cardHeight, { fill: COLORS.paper, stroke: COLORS.ruleDark, strokeWidth: 1, rx: 6 })}
        ${renderRule(RAIL_X + 14, noteY + 18, RAIL_WIDTH - 28, COLORS.rule)}
        ${renderTextLines(card.title, RAIL_X + 16, noteY + 42, '"Noto Serif SC"', 21, COLORS.foreground, { fontWeight: 700 })}
        ${renderTextLines(card.body, RAIL_X + 16, noteY + 42 + card.title.height + 14, '"Noto Serif SC"', 16, COLORS.muted)}
      `;
      noteY += cardHeight + 14;
      return svg;
    }).join("");
  })()}

  ${renderRule(PAGE_PADDING, closingRuleY, CONTENT_WIDTH, COLORS.ruleDark, 1.3)}
  <text x="${PAGE_PADDING}" y="${closingLabelY}" fill="${COLORS.accent}" font-family="JetBrains Mono" font-size="12" font-weight="700">POSTSCRIPT</text>
  ${renderTextLines(closingText, PAGE_PADDING + 50, closingTextY, '"Noto Serif SC"', 24, COLORS.foreground, { width: CONTENT_WIDTH - 100, align: "center", fontStyle: "italic" })}

  <text x="${PAGE_PADDING}" y="${footerY}" fill="${COLORS.muted}" font-family="Inter" font-size="13">Built from live report data with pretext line layout</text>
  <text x="${WIDTH - PAGE_PADDING}" y="${footerY}" fill="${COLORS.muted}" font-family="JetBrains Mono" font-size="13" text-anchor="end">Classic News / export-ready / ${escapeXml(content.postId)}</text>
</svg>`.trim(),
  };
}
