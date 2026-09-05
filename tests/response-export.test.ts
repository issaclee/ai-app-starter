import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseInlineMarkdown, parseMarkdownBlocks } from "@/lib/markdown-blocks";
import { exportResponse } from "@/lib/response-export";

const markdown = "# Summary\n\nA **formatted** response.\n\n| Name | Status | Notes |\n|:-----|:------:|------:|\n| **Parser** | Ready | Supports `a\\|b` |\n| Exporter | Ready | PDF and Word |\n\n- First item\n- Second item\n\n```ts\nconst ready = true;\n```";
const longTableMarkdown = `## What I Can Do

| Domain | What I Help With | Quick Example |
|---|---|---|
| **Answering Questions** | Factual, conceptual, or opinion-based queries | Explain quantum tunneling in simple terms. |
| **Conversation and Advice** | Socratic chat, brainstorming, and general life advice | I am stuck with a project. What steps can I take? |
| **Writing and Editing** | Draft emails, essays, speeches, stories, and product descriptions | Write a post about remote work. |
| **Technical Help** | Code snippets, debugging hints, and algorithm explanations | Show how to reverse a linked list in C++. |
| **Learning and Tutoring** | Step-by-step explanations for math, science, and languages | Explain the Pythagorean theorem. |
| **Creative Content** | Poetry, jokes, characters, dialogue, and plot outlines | Generate a one-line joke about coffee. |
| **Information Retrieval** | Summaries, fact checking, and contextual explanations | Summarize the Paris Agreement. |
| **Data and Statistics** | Dataset summaries, interpretation, and basic projections | Interpret the mean and standard deviation. |
| **Formatting and Templates** | Resumes, cover letters, interview preparation, and plans | Create a two-page resume for a data scientist. |`;

async function writeQaFixture(filename: string, body: Uint8Array) {
  const outputDirectory = process.env.CHAT_EXPORT_QA_DIR;
  if (!outputDirectory) return;
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, filename), body);
}

describe("parseMarkdownBlocks", () => {
  it("preserves common Markdown block structure", () => {
    expect(parseMarkdownBlocks(markdown).map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "table",
      "bullet",
      "bullet",
      "code",
    ]);
  });

  it("parses GFM pipe tables with alignment and escaped pipes", () => {
    expect(parseMarkdownBlocks(markdown).find((block) => block.type === "table")).toEqual({
      type: "table",
      headers: ["Name", "Status", "Notes"],
      alignments: ["left", "center", "right"],
      rows: [
        ["**Parser**", "Ready", "Supports `a|b`"],
        ["Exporter", "Ready", "PDF and Word"],
      ],
    });
  });

  it("preserves common inline emphasis", () => {
    expect(parseInlineMarkdown("A **bold** and `coded` value.")).toEqual([
      { text: "A " },
      { text: "bold", bold: true },
      { text: " and " },
      { text: "coded", code: true },
      { text: " value." },
    ]);
  });
});

describe("exportResponse", () => {
  it("exports Markdown without changing its content", async () => {
    const exported = await exportResponse(markdown, "md");
    expect(new TextDecoder().decode(exported.body)).toBe(markdown);
    expect(exported.filename).toBe("assistant-response.md");
  });

  it("creates a valid PDF payload", async () => {
    const exported = await exportResponse(longTableMarkdown, "pdf");
    await writeQaFixture(exported.filename, exported.body);
    expect(Buffer.from(exported.body.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(exported.body.byteLength).toBeGreaterThan(500);
  });

  it("creates a valid DOCX ZIP payload", async () => {
    const exported = await exportResponse(longTableMarkdown, "docx");
    await writeQaFixture(exported.filename, exported.body);
    expect(Buffer.from(exported.body.subarray(0, 2)).toString()).toBe("PK");
    expect(exported.body.byteLength).toBeGreaterThan(1_000);
  });
});
