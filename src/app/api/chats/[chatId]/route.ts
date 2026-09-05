import { auth } from "@/auth";
import { renameChatSchema, saveChatSchema } from "@/lib/chat-history";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ chatId: string }> };

async function getOwner() {
  return (await auth())?.user?.email?.trim().toLowerCase() || null;
}

async function ownedChat(chatId: string, ownerEmail: string) {
  return prisma.chat.findFirst({ where: { id: chatId, ownerEmail }, select: { id: true } });
}

export async function GET(_request: Request, { params }: Context) {
  const email = await getOwner();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { chatId } = await params;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, ownerEmail: email },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: { orderBy: { position: "asc" }, select: { role: true, content: true } },
    },
  });
  if (!chat) return Response.json({ error: "Chat not found." }, { status: 404 });

  return Response.json({ ...chat, updatedAt: chat.updatedAt.toISOString() });
}

export async function PUT(request: Request, { params }: Context) {
  const email = await getOwner();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { chatId } = await params;
  if (!(await ownedChat(chatId, email))) return Response.json({ error: "Chat not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = saveChatSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid chat history." }, { status: 400 });

  const chat = await prisma.chat.update({
    where: { id: chatId },
    data: {
      messages: {
        deleteMany: {},
        create: parsed.data.messages.map((message, position) => ({ ...message, position })),
      },
    },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({ ...chat, updatedAt: chat.updatedAt.toISOString() });
}

export async function PATCH(request: Request, { params }: Context) {
  const email = await getOwner();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { chatId } = await params;
  if (!(await ownedChat(chatId, email))) return Response.json({ error: "Chat not found." }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = renameChatSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Enter a chat name between 1 and 80 characters." }, { status: 400 });

  const chat = await prisma.chat.update({
    where: { id: chatId },
    data: { title: parsed.data.title },
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json({ ...chat, updatedAt: chat.updatedAt.toISOString() });
}

export async function DELETE(_request: Request, { params }: Context) {
  const email = await getOwner();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { chatId } = await params;
  const deleted = await prisma.chat.deleteMany({ where: { id: chatId, ownerEmail: email } });
  if (!deleted.count) return Response.json({ error: "Chat not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
