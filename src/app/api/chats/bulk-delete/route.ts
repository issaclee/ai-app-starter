import { getActiveSession } from "@/lib/app-session";
import { bulkDeleteChatsSchema } from "@/lib/chat-history";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const email = (await getActiveSession())?.user?.email?.trim().toLowerCase();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = bulkDeleteChatsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid chat selection." }, { status: 400 });

  const result = await prisma.chat.deleteMany({
    where: { ownerEmail: email, id: { in: parsed.data.ids } },
  });
  return Response.json({ deleted: result.count });
}
