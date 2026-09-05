import { auth } from "@/auth";
import { createChatTitle, saveChatSchema } from "@/lib/chat-history";
import { prisma } from "@/lib/db";

function ownerEmail(session: { user?: { email?: string | null } } | null) {
  return session?.user?.email?.trim().toLowerCase() || null;
}

export async function GET() {
  const email = ownerEmail(await auth());
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const chats = await prisma.chat.findMany({
    where: { ownerEmail: email },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({
    chats: chats.map((chat) => ({ ...chat, updatedAt: chat.updatedAt.toISOString() })),
  });
}

export async function POST(request: Request) {
  const email = ownerEmail(await auth());
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }

  const parsed = saveChatSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid chat history." }, { status: 400 });

  const firstUserMessage = parsed.data.messages.find((message) => message.role === "user");
  const chat = await prisma.chat.create({
    data: {
      ownerEmail: email,
      title: createChatTitle(firstUserMessage?.content ?? ""),
      messages: {
        create: parsed.data.messages.map((message, position) => ({ ...message, position })),
      },
    },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({ ...chat, updatedAt: chat.updatedAt.toISOString() }, { status: 201 });
}
