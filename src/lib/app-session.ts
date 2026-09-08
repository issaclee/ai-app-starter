import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

function cleanHeader(value: string | null, maxLength: number) {
  const clean = value?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return clean ? clean.slice(0, maxLength) : null;
}

async function requestMetadata() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? null;
  return { userAgent: cleanHeader(requestHeaders.get("user-agent"), 512), ipAddress: cleanHeader(forwarded || requestHeaders.get("x-real-ip"), 64) };
}

export async function getActiveSession() {
  const session = await auth();
  if (!session?.user?.localUserId || !session.sessionId) return null;
  const now = new Date();
  const includeUser = { user: { select: { email: true, name: true, role: true, status: true } } } as const;
  let connection = await prisma.connectionSession.findUnique({ where: { id: session.sessionId }, include: includeUser });

  if (!connection) {
    const user = await prisma.user.findUnique({ where: { id: session.user.localUserId }, select: { id: true, status: true, passwordHash: true, externalIdentities: { select: { provider: true } } } });
    if (!user || user.status !== "ACTIVE") return null;
    const expiresAt = new Date(session.expires);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) return null;
    try {
      connection = await prisma.connectionSession.create({
        data: { id: session.sessionId, userId: user.id, provider: session.authProvider ?? (user.passwordHash === "!oauth-only" && user.externalIdentities.length === 1 ? user.externalIdentities[0].provider : "credentials"), expiresAt, ...(await requestMetadata()) },
        include: includeUser,
      });
    } catch {
      connection = await prisma.connectionSession.findUnique({ where: { id: session.sessionId }, include: includeUser });
    }
  }

  if (!connection || connection.userId !== session.user.localUserId || connection.revokedAt || connection.expiresAt <= now || connection.user.status !== "ACTIVE") return null;
  if (now.getTime() - connection.lastActiveAt.getTime() >= ACTIVITY_WRITE_INTERVAL_MS) {
    await prisma.connectionSession.update({ where: { id: connection.id }, data: { lastActiveAt: now } });
  }
  session.user.email = connection.user.email;
  session.user.name = connection.user.name;
  session.user.role = connection.user.role === "ADMIN" ? "ADMIN" : "USER";
  return session;
}
