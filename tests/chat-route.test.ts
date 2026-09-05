import { expect, it } from "vitest";
import { handleChatRequest } from "@/lib/chat-handler";
import { ProviderError } from "@/lib/llm";

function stream(value: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

it("rejects unauthenticated chat requests", async () => {
  const response = await handleChatRequest(
    new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }) }),
    { getSession: async () => null, reply: async () => stream("unused") },
  );
  expect(response.status).toBe(401);
});

it("returns a plain-text response stream", async () => {
  let selectedProvider: string | undefined;
  const response = await handleChatRequest(
    new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }], provider: "ollama" }) }),
    {
      getSession: async () => ({ user: { email: "user@example.com" } }),
      reply: async (_messages, provider) => {
        selectedProvider = provider;
        return stream("Streamed reply");
      },
    },
  );
  expect(response.status).toBe(200);
  expect(selectedProvider).toBe("ollama");
  expect(response.headers.get("content-type")).toContain("text/plain");
  expect(await response.text()).toBe("Streamed reply");
});

it("rejects provider identifiers that are not configured provider types", async () => {
  const response = await handleChatRequest(
    new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }], provider: "external" }) }),
    { getSession: async () => ({ user: { email: "user@example.com" } }), reply: async () => stream("unused") },
  );
  expect(response.status).toBe(400);
});

it("returns safe provider configuration errors", async () => {
  const response = await handleChatRequest(
    new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }) }),
    {
      getSession: async () => ({ user: { email: "configured@example.com" } }),
      reply: async () => { throw new ProviderError("The configured provider is unavailable."); },
    },
  );
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: "The configured provider is unavailable." });
});
