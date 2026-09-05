import { describe, expect, it } from "vitest";
import { createChatTitle, groupChatHistory, renameChatSchema, saveChatSchema } from "@/lib/chat-history";

function chat(id: string, title: string, updatedAt: Date) {
  return { id, title, updatedAt: updatedAt.toISOString() };
}

describe("chat history", () => {
  it("groups chats into current, yesterday, and the previous 30 days", () => {
    const now = new Date(2026, 8, 5, 12);
    const groups = groupChatHistory([
      chat("today", "Today", new Date(2026, 8, 5, 1)),
      chat("yesterday", "Yesterday", new Date(2026, 8, 4, 18)),
      chat("recent", "Recent", new Date(2026, 7, 15, 9)),
      chat("old", "Old", new Date(2026, 7, 5, 0)),
    ], now);

    expect(groups.current.map(({ id }) => id)).toEqual(["today"]);
    expect(groups.yesterday.map(({ id }) => id)).toEqual(["yesterday"]);
    expect(groups.previous30.map(({ id }) => id)).toEqual(["recent"]);
  });

  it("creates compact titles from the first message", () => {
    expect(createChatTitle("  Plan   a product launch  ")).toBe("Plan a product launch");
    expect(createChatTitle("x".repeat(100))).toBe(`${"x".repeat(57)}…`);
  });

  it("validates saved messages and rename limits", () => {
    expect(saveChatSchema.safeParse({ messages: [{ role: "user", content: "Hello" }] }).success).toBe(true);
    expect(saveChatSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(renameChatSchema.safeParse({ title: "  New title  " }).data?.title).toBe("New title");
    expect(renameChatSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
