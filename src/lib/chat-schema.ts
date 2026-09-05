import { z } from "zod";

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_LENGTH = 8_000;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_MESSAGE_LENGTH),
});

export const chatRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(MAX_MESSAGES),
    provider: z.enum(["openai", "ollama"]).optional(),
  })
  .superRefine(({ messages }, context) => {
    const last = messages.at(-1);
    if (!last || last.role !== "user" || !last.content.trim()) {
      context.addIssue({
        code: "custom",
        path: ["messages", Math.max(0, messages.length - 1), "content"],
        message: "The latest message must contain user text.",
      });
    }
  });

export type ChatMessage = z.infer<typeof chatMessageSchema>;
