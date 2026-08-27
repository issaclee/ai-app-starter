import { expect, it } from "vitest";
import { handleChatRequest } from "@/lib/chat-handler";

it("rejects unauthenticated chat requests", async () => {
  const response = await handleChatRequest(
    new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }) }),
    { getSession: async () => null, reply: async () => "unused" },
  );
  expect(response.status).toBe(401);
});
