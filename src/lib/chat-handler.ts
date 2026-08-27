import { chatRequestSchema, type ChatMessage } from "@/lib/chat-schema";
import { checkRateLimit } from "@/lib/rate-limit";

export type ChatSession = { user?: { email?: string | null } } | null;
export type ChatDependencies = {
  getSession: () => Promise<ChatSession>;
  reply: (messages: ChatMessage[]) => Promise<string>;
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
    const message = await dependencies.reply(parsed.data.messages);
    return Response.json({ message });
  } catch (error) {
    console.error("Chat provider request failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The assistant is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
