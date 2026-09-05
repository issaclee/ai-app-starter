export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; text: string; number: number }
  | { type: "quote"; text: string }
  | { type: "code"; text: string; language?: string }
  | { type: "table"; headers: string[]; rows: string[][]; alignments: TableAlignment[] };

export type MarkdownSpan = { text: string; bold?: boolean; italics?: boolean; code?: boolean };
export type TableAlignment = "left" | "center" | "right";

function parseTableRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return null;
  const content = trimmed
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "");
  const cells: string[] = [];
  let cell = "";
  let inCode = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\\" && content[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (character === "`") {
      inCode = !inCode;
      cell += character;
    } else if (character === "|" && !inCode) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseTableDelimiter(line: string, columnCount: number) {
  const cells = parseTableRow(line);
  if (!cells || cells.length !== columnCount || !cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  return cells.map<TableAlignment>((cell) => {
    if (cell.startsWith(":") && cell.endsWith(":")) return "center";
    if (cell.endsWith(":")) return "right";
    return "left";
  });
}

export function parseMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let code: string[] | null = null;
  let language = "";

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const fence = line.match(/^```\s*([^\s]*)/);
    if (fence) {
      if (code) {
        blocks.push({ type: "code", text: code.join("\n"), language: language || undefined });
        code = null;
        language = "";
      } else {
        flushParagraph();
        code = [];
        language = fence[1] ?? "";
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const tableHeaders = parseTableRow(line);
    const tableAlignments = tableHeaders
      ? parseTableDelimiter(lines[lineIndex + 1] ?? "", tableHeaders.length)
      : null;
    if (tableHeaders && tableAlignments) {
      flushParagraph();
      const rows: string[][] = [];
      lineIndex += 2;
      while (lineIndex < lines.length) {
        const row = parseTableRow(lines[lineIndex]);
        if (!row) break;
        rows.push(Array.from({ length: tableHeaders.length }, (_, index) => row[index] ?? ""));
        lineIndex += 1;
      }
      lineIndex -= 1;
      blocks.push({ type: "table", headers: tableHeaders, rows, alignments: tableAlignments });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet) {
      flushParagraph();
      blocks.push({ type: "bullet", text: bullet[1] });
    } else if (numbered) {
      flushParagraph();
      blocks.push({ type: "numbered", number: Number(numbered[1]), text: numbered[2] });
    } else if (quote) {
      flushParagraph();
      blocks.push({ type: "quote", text: quote[1] });
    } else {
      paragraph.push(line.trim());
    }
  }
  if (code) blocks.push({ type: "code", text: code.join("\n"), language: language || undefined });
  flushParagraph();
  return blocks;
}

export function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function parseInlineMarkdown(value: string) {
  const spans: MarkdownSpan[] = [];
  const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)]+)\))/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) spans.push({ text: value.slice(cursor, index) });
    if (match[2] || match[3]) spans.push({ text: match[2] ?? match[3], bold: true });
    else if (match[4]) spans.push({ text: match[4], code: true });
    else if (match[5] || match[6]) spans.push({ text: match[5] ?? match[6], italics: true });
    else if (match[7]) spans.push({ text: `${match[7]} (${match[8]})` });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) spans.push({ text: value.slice(cursor) });
  return spans.length ? spans : [{ text: value }];
}
