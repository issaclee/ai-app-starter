import { describe, expect, it } from "vitest";
import { chatRequestSchema, MAX_MESSAGE_LENGTH } from "@/lib/chat-schema";

describe("chatRequestSchema", () => {
  it("rejects an empty request", () => expect(chatRequestSchema.safeParse({ messages: [] }).success).toBe(false));
  it("rejects a blank latest user message", () => expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "  " }] }).success).toBe(false));
  it("rejects oversized content", () => expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(MAX_MESSAGE_LENGTH + 1) }] }).success).toBe(false));
  it("accepts a normal conversation", () => expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "Hello" }] }).success).toBe(true));
});
