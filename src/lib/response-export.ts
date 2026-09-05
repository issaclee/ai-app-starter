import PDFDocument from "pdfkit";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { parseInlineMarkdown, parseMarkdownBlocks, stripInlineMarkdown, type MarkdownBlock } from "@/lib/markdown-blocks";

export type ExportFormat = "md" | "pdf" | "docx";
export type ExportedResponse = {
  body: Uint8Array;
  contentType: string;
  filename: string;
};

type TableBlock = Extract<MarkdownBlock, { type: "table" }>;
type TextMarkdownBlock = Exclude<MarkdownBlock, TableBlock>;
const DOCX_CONTENT_WIDTH = 10_080;

function tableColumnFractions(block: TableBlock) {
  const lengths = block.headers.map((header, columnIndex) => Math.max(
    8,
    ...[header, ...block.rows.map((row) => row[columnIndex] ?? "")]
      .map((cell) => Math.min(stripInlineMarkdown(cell).length, 120)),
  ));
  const weights = lengths.map((length) => Math.sqrt(length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

function docxRuns(value: string, header = false) {
  return parseInlineMarkdown(value).map((span) => new TextRun({
    text: span.text,
    bold: header || span.bold,
    italics: span.italics,
    color: header ? "FFFFFF" : "000000",
    font: span.code ? "Courier New" : "Arial",
    size: header ? 20 : 21,
  }));
}

function docxTable(block: TableBlock) {
  const columnWidths = tableColumnFractions(block).map((fraction) => Math.round(DOCX_CONTENT_WIDTH * fraction));
  const border = { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" };
  const createCell = (value: string, columnIndex: number, header: boolean, rowIndex = 0) => new TableCell({
    width: { size: columnWidths[columnIndex], type: WidthType.DXA },
    margins: { top: 110, right: 120, bottom: 110, left: 120 },
    verticalAlign: VerticalAlign.CENTER,
    shading: {
      type: ShadingType.CLEAR,
      fill: header ? "2F5597" : rowIndex % 2 === 0 ? "FFFFFF" : "F3F6FA",
    },
    children: [new Paragraph({
      children: docxRuns(value, header),
      alignment: block.alignments[columnIndex] === "center"
        ? AlignmentType.CENTER
        : block.alignments[columnIndex] === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 260 },
    })],
  });
  return new Table({
    width: { size: DOCX_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    margins: { top: 110, right: 120, bottom: 110, left: 120 },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: block.headers.map((header, columnIndex) => createCell(header, columnIndex, true)),
      }),
      ...block.rows.map((row, rowIndex) => new TableRow({
        children: block.headers.map((_, columnIndex) => createCell(row[columnIndex] ?? "", columnIndex, false, rowIndex)),
      })),
    ],
  });
}

function docxParagraph(block: TextMarkdownBlock) {
  const text = stripInlineMarkdown(block.text);
  const inlineRuns = () => parseInlineMarkdown(block.text).map((span) => new TextRun({
    text: span.text,
    bold: span.bold,
    italics: span.italics,
    font: span.code ? "Courier New" : "Arial",
  }));
  if (block.type === "heading") {
    const heading = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ][Math.min(block.level, 6) - 1];
    return new Paragraph({ text, heading, spacing: { before: 220, after: 100 } });
  }
  if (block.type === "bullet") {
    return new Paragraph({ children: inlineRuns(), bullet: { level: 0 }, spacing: { after: 80 } });
  }
  if (block.type === "numbered") {
    return new Paragraph({ children: [new TextRun(`${block.number}. ${text}`)], indent: { left: 360 }, spacing: { after: 80 } });
  }
  if (block.type === "quote") {
    return new Paragraph({ children: [new TextRun({ text, italics: true, color: "555555" })], indent: { left: 420 }, spacing: { after: 120 } });
  }
  if (block.type === "code") {
    return new Paragraph({
      children: [new TextRun({ text: block.text, font: "Courier New", size: 19 })],
      shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
      spacing: { before: 80, after: 140 },
    });
  }
  return new Paragraph({ children: inlineRuns(), spacing: { after: 140, line: 300 } });
}

function docxBlock(block: MarkdownBlock) {
  return block.type === "table" ? docxTable(block) : docxParagraph(block);
}

async function createDocx(markdown: string) {
  const children = [
    new Paragraph({
      text: "Assistant Response",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 260 },
    }),
    ...parseMarkdownBlocks(markdown).map(docxBlock),
  ];
  const document = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: "000000" } },
        title: { run: { font: "Arial", size: 34, bold: true, color: "000000" } },
        heading1: { run: { font: "Arial", size: 28, bold: true, color: "000000" } },
        heading2: { run: { font: "Arial", size: 25, bold: true, color: "000000" } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children,
    }],
  });
  return new Uint8Array(await Packer.toBuffer(document));
}

function pdfTable(document: PDFKit.PDFDocument, block: TableBlock) {
  const availableWidth = document.page.width - document.page.margins.left - document.page.margins.right;
  const columnStyles = tableColumnFractions(block).map((fraction) => ({ width: availableWidth * fraction }));
  const cell = (value: string, columnIndex: number, header: boolean, rowIndex = 0): PDFKit.Mixins.CellOptions => ({
    text: stripInlineMarkdown(value),
    type: header ? "TH" : "TD",
    font: {
      src: header || /^(\*\*|__).+\1$/.test(value.trim()) ? "Helvetica-Bold" : "Helvetica",
      size: header ? 9.5 : 9,
    },
    textColor: header ? "#FFFFFF" : "#111111",
    backgroundColor: header ? "#2F5597" : rowIndex % 2 === 0 ? "#FFFFFF" : "#F3F6FA",
    border: 0.5,
    borderColor: "#D9D9D9",
    padding: { top: 6, right: 6, bottom: 6, left: 6 },
    align: { x: block.alignments[columnIndex], y: "center" },
    textOptions: { lineGap: 2 },
  });
  document.table({
    maxWidth: availableWidth,
    columnStyles,
    data: [
      block.headers.map((header, columnIndex) => cell(header, columnIndex, true)),
      ...block.rows.map((row, rowIndex) => block.headers.map((_, columnIndex) => cell(row[columnIndex] ?? "", columnIndex, false, rowIndex))),
    ],
  });
  document.moveDown(0.65);
}

function renderPdfBlock(document: PDFKit.PDFDocument, block: MarkdownBlock) {
  if (block.type === "table") {
    pdfTable(document, block);
    return;
  }
  const text = stripInlineMarkdown(block.text);
  const renderInline = (prefix = "", indent = 0, paragraphGap = 9) => {
    const spans = [{ text: prefix }, ...parseInlineMarkdown(block.text)].filter((span) => span.text);
    spans.forEach((span, index) => {
      const font = "code" in span && span.code
        ? "Courier"
        : "bold" in span && span.bold
          ? "Helvetica-Bold"
          : "italics" in span && span.italics
            ? "Helvetica-Oblique"
            : "Helvetica";
      document.font(font).fontSize(11).fillColor("#111111").text(span.text, {
        continued: index < spans.length - 1,
        indent: index === 0 ? indent : 0,
        lineGap: 3,
        paragraphGap: index === spans.length - 1 ? paragraphGap : 0,
      });
    });
  };
  if (block.type === "heading") {
    const sizes = [18, 16, 14, 12, 11, 11];
    document.moveDown(0.45).font("Helvetica-Bold").fontSize(sizes[Math.min(block.level, 6) - 1]).fillColor("#000000").text(text).moveDown(0.25);
  } else if (block.type === "bullet") {
    renderInline("- ", 14, 5);
  } else if (block.type === "numbered") {
    document.font("Helvetica").fontSize(11).fillColor("#111111").text(`${block.number}. ${text}`, { indent: 14, paragraphGap: 5 });
  } else if (block.type === "quote") {
    document.font("Helvetica-Oblique").fontSize(11).fillColor("#555555").text(text, { indent: 20, paragraphGap: 8 });
  } else if (block.type === "code") {
    document.font("Courier").fontSize(9.5).fillColor("#222222").text(block.text, { indent: 14, paragraphGap: 10 });
  } else {
    renderInline();
  }
}

function createPdf(markdown: string) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument({ size: "LETTER", margins: { top: 54, right: 54, bottom: 54, left: 54 }, info: { Title: "Assistant Response" } });
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    document.on("error", reject);
    document.font("Helvetica-Bold").fontSize(20).fillColor("#000000").text("Assistant Response").moveDown(0.8);
    for (const block of parseMarkdownBlocks(markdown)) renderPdfBlock(document, block);
    document.end();
  });
}

export async function exportResponse(content: string, format: ExportFormat): Promise<ExportedResponse> {
  if (format === "md") {
    return {
      body: new TextEncoder().encode(content),
      contentType: "text/markdown; charset=utf-8",
      filename: "assistant-response.md",
    };
  }
  if (format === "pdf") {
    return {
      body: await createPdf(content),
      contentType: "application/pdf",
      filename: "assistant-response.pdf",
    };
  }
  return {
    body: await createDocx(content),
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "assistant-response.docx",
  };
}
