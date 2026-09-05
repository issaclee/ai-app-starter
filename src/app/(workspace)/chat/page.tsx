import type { Metadata } from "next";
import { ChatInterface } from "@/components/chat-interface";
import { providerOptions } from "@/lib/llm";

export const metadata: Metadata = { title: "Chat" };
export default async function ChatPage() {
  const catalog = await providerOptions();
  return <ChatInterface key={catalog.initialProvider ?? "unconfigured"} {...catalog} />;
}
