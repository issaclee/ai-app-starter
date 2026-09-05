// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "@/lib/html-to-markdown";

describe("htmlToMarkdown", () => {
  it("preserves common rich-text formatting", () => {
    expect(htmlToMarkdown("<h2>Summary</h2><p>A <strong>bold</strong> and <em>useful</em> answer.</p><ul><li>First</li><li>Second</li></ul>")).toBe(
      "## Summary\n\nA **bold** and *useful* answer.\n\n-   First\n-   Second",
    );
  });

  it("converts an edited visual table back to GFM Markdown", () => {
    const markdown = htmlToMarkdown("<table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>Parser</td><td>Ready</td></tr></tbody></table>");
    expect(markdown).toContain("| Name");
    expect(markdown).toContain("| ---");
    expect(markdown).toContain("| Parser");
    expect(markdown).toContain("| Ready");
  });
});
