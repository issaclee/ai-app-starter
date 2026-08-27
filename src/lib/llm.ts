import OpenAI from "openai";
import type { ChatMessage } from "@/lib/chat-schema";

export type ProviderKind = "openai" | "ollama" | "echo";
export type ProviderConfig = {
  LLM_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
};

export function selectProvider(config: ProviderConfig): ProviderKind {
  const provider = config.LLM_PROVIDER?.trim().toLowerCase();
  if (provider === "openai" && config.OPENAI_API_KEY?.trim() && config.OPENAI_MODEL?.trim()) {
    return "openai";
  }
  if (provider === "ollama" && config.OLLAMA_BASE_URL?.trim() && config.OLLAMA_MODEL?.trim()) {
    return "ollama";
  }
  return "echo";
}

export function currentProvider() {
  return selectProvider({
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  });
}

export function echoReply(messages: ChatMessage[]) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  return `Echo: ${latest?.content.trim() ?? ""}`;
}

async function openAIReply(messages: ChatMessage[]) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL!,
    input: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
  const text = response.output_text?.trim();
  if (!text) throw new Error("The model returned an empty response.");
  return text;
}

async function ollamaReply(messages: ChatMessage[]) {
  const baseUrl = process.env.OLLAMA_BASE_URL!.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      messages,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error("Ollama request failed.");
  const data = (await response.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim();
  if (!text) throw new Error("Ollama returned an empty response.");
  return text;
}

export async function generateReply(messages: ChatMessage[]) {
  const provider = currentProvider();
  if (provider === "openai") return openAIReply(messages);
  if (provider === "ollama") return ollamaReply(messages);
  return echoReply(messages);
}
