import type { Metadata } from "next";
import { ChatInterface } from "@/components/chat-interface";
import { providerOptions } from "@/lib/llm";

export const metadata: Metadata = { title: "Chat" };

export default async function SavedChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const [{ chatId }, catalog] = await Promise.all([params, providerOptions()]);
  return <ChatInterface key={`${chatId}:${catalog.initialProvider ?? "unconfigured"}`} chatId={chatId} {...catalog} />;
}
