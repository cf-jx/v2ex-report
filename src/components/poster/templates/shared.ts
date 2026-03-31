type PretextLayoutModule = typeof import("@chenglou/pretext");
type WhiteSpaceMode = "normal" | "pre-wrap";

export type PretextModule = PretextLayoutModule;

export interface PosterBuildResult {
  svg: string;
  width: number;
  height: number;
  background?: string;
}

export interface TextLine {
  text: string;
  width: number;
}

export interface TextBlock {
  lines: TextLine[];
  lineHeight: number;
  height: number;
}

export interface RenderTextOptions {
  fontWeight?: number;
  align?: "left" | "center" | "right";
  width?: number;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
}

export interface ColumnSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  lineHeight: number;
}

export interface FlowLine {
  text: string;
  width: number;
  x: number;
  y: number;
  columnIndex: number;
}

export interface FlowLayoutResult {
  lines: FlowLine[];
  height: number;
  columnCount: number;
}

export interface FlowLayoutOptions {
  whiteSpace?: WhiteSpaceMode;
  startCursor?: {
    segmentIndex: number;
    graphemeIndex: number;
  };
}

export interface SvgRectOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  opacity?: number;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function layoutText(
  pretext: PretextModule,
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: { whiteSpace?: WhiteSpaceMode } = {},
): TextBlock {
  const prepared = pretext.prepareWithSegments(text, font, {
    whiteSpace: options.whiteSpace ?? "pre-wrap",
  });
  const result = pretext.layoutWithLines(prepared, maxWidth, lineHeight);

  return {
    lines: result.lines.map((line) => ({ text: line.text, width: line.width })),
    lineHeight,
    height: result.height,
  };
}

export function renderTextLines(
  block: TextBlock,
  x: number,
  y: number,
  fontFamily: string,
  fontSize: number,
  fill: string,
  options: RenderTextOptions = {},
): string {
  const {
    fontWeight = 400,
    align = "left",
    width = 0,
    fontStyle = "normal",
    letterSpacing,
  } = options;

  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const textX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;
  const spacing = letterSpacing !== undefined ? ` letter-spacing="${letterSpacing}"` : "";

  return block.lines
    .map((line, index) => {
      const lineY = y + index * block.lineHeight;
      return `<text x="${textX}" y="${lineY}" fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" text-anchor="${anchor}"${spacing} xml:space="preserve">${escapeXml(line.text)}</text>`;
    })
    .join("");
}

export function renderRule(
  x: number,
  y: number,
  width: number,
  stroke: string,
  strokeWidth = 1,
): string {
  return `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

export function renderRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SvgRectOptions = {},
): string {
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `width="${width}"`,
    `height="${height}"`,
  ];

  if (options.fill) attrs.push(`fill="${options.fill}"`);
  if (options.stroke) attrs.push(`stroke="${options.stroke}"`);
  if (options.strokeWidth !== undefined) attrs.push(`stroke-width="${options.strokeWidth}"`);
  if (options.rx !== undefined) attrs.push(`rx="${options.rx}"`);
  if (options.opacity !== undefined) attrs.push(`opacity="${options.opacity}"`);

  return `<rect ${attrs.join(" ")} />`;
}

export function layoutColumnFlow(
  pretext: PretextModule,
  text: string,
  font: string,
  columns: ColumnSpec[],
  options: FlowLayoutOptions = {},
): FlowLayoutResult {
  if (columns.length === 0) {
    return { lines: [], height: 0, columnCount: 0 };
  }

  const prepared = pretext.prepareWithSegments(text, font, {
    whiteSpace: options.whiteSpace ?? "pre-wrap",
  });
  const cursor =
    options.startCursor ?? ({
      segmentIndex: 0,
      graphemeIndex: 1,
    } as const);

  let currentCursor = cursor;
  const lines: FlowLine[] = [];
  let lastBottom = columns[0]!.y;

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const column = columns[columnIndex]!;
    let lineTop = column.y;

    while (lineTop + column.lineHeight <= column.y + column.height) {
      const line = pretext.layoutNextLine(prepared, currentCursor, column.width);
      if (line === null) {
        return {
          lines,
          height: Math.max(0, lastBottom - columns[0]!.y),
          columnCount: columns.length,
        };
      }

      lines.push({
        text: line.text,
        width: line.width,
        x: column.x,
        y: lineTop,
        columnIndex,
      });

      currentCursor = line.end;
      lineTop += column.lineHeight;
      lastBottom = Math.max(lastBottom, lineTop);
    }
  }

  return {
    lines,
    height: Math.max(0, lastBottom - columns[0]!.y),
    columnCount: columns.length,
  };
}
