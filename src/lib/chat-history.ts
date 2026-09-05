import { z } from "zod";
import { chatMessageSchema, MAX_MESSAGES } from "@/lib/chat-schema";

export const MAX_CHAT_TITLE_LENGTH = 80;

export const saveChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(MAX_MESSAGES),
});

export const renameChatSchema = z.object({
  title: z.string().trim().min(1).max(MAX_CHAT_TITLE_LENGTH),
});

export const bulkDeleteChatsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type HistoryGroup = "current" | "yesterday" | "previous30";

export function createChatTitle(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 60) return compact || "New chat";
  return `${compact.slice(0, 57).trimEnd()}…`;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function groupChatHistory(chats: ChatSummary[], now = new Date()) {
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups: Record<HistoryGroup, ChatSummary[]> = {
    current: [],
    yesterday: [],
    previous30: [],
  };

  for (const chat of chats) {
    const updatedAt = new Date(chat.updatedAt);
    if (updatedAt >= today) groups.current.push(chat);
    else if (updatedAt >= yesterday) groups.yesterday.push(chat);
    else if (updatedAt >= thirtyDaysAgo) groups.previous30.push(chat);
  }

  return groups;
}
