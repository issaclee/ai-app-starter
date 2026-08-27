import { describe, expect, it } from "vitest";
import { echoReply, selectProvider } from "@/lib/llm";

describe("selectProvider", () => {
  it("uses echo when configuration is missing", () => expect(selectProvider({})).toBe("echo"));
  it("uses echo for an invalid provider", () => expect(selectProvider({ LLM_PROVIDER: "other" })).toBe("echo"));
  it("requires complete OpenAI configuration", () => {
    expect(selectProvider({ LLM_PROVIDER: "openai", OPENAI_API_KEY: "key" })).toBe("echo");
    expect(selectProvider({ LLM_PROVIDER: "openai", OPENAI_API_KEY: "key", OPENAI_MODEL: "model" })).toBe("openai");
  });
  it("requires complete Ollama configuration", () => {
    expect(selectProvider({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434" })).toBe("echo");
    expect(selectProvider({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434", OLLAMA_MODEL: "llama" })).toBe("ollama");
  });
});

it("echoes the latest user message", () => {
  expect(echoReply([{ role: "user", content: "first" }, { role: "assistant", content: "reply" }, { role: "user", content: " latest " }])).toBe("Echo: latest");
});
