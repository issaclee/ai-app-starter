import { chatRequestSchema, type ChatMessage } from "@/lib/chat-schema";
import { ProviderError, type ProviderOption } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";

export type ChatSession = { user?: { email?: string | null } } | null;
export type ChatDependencies = {
  getSession: () => Promise<ChatSession>;
  reply: (messages: ChatMessage[], provider?: ProviderOption["id"]) => Promise<ReadableStream<Uint8Array>>;
};

export async function handleChatRequest(request: Request, dependencies: ChatDependencies) {
  const session = await dependencies.getSession();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rate = checkRateLimit(`chat:${session.user.email}`, 30, 60_000);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid chat request." }, { status: 400 });

  try {
    const stream = await dependencies.reply(parsed.data.messages, parsed.data.provider);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Chat provider request failed", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof ProviderError
      ? error.publicMessage
      : "The assistant is temporarily unavailable. Please try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
