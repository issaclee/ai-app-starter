import { prisma } from "@/lib/db";
import type { UserApiError } from "@/lib/user-management";

export type ManagedConnectionSession = {
  id: string;
  provider: string;
  client: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

function clientName(userAgent: string | null) {
  if (!userAgent) return "Unknown client";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const os = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS X/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : "Unknown device";
  return `${browser} on ${os}`;
}

export async function listConnectionSessions(userId: string, currentSessionId: string): Promise<ManagedConnectionSession[] | UserApiError> {
  if (!await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) return { status: 404, error: "User not found." };
  const now = new Date();
  const sessions = await prisma.connectionSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastActiveAt: "desc" },
  });
  return sessions.map((session) => ({ id: session.id, provider: session.provider, client: clientName(session.userAgent), ipAddress: session.ipAddress ?? "Unknown", createdAt: session.createdAt.toISOString(), lastActiveAt: session.lastActiveAt.toISOString(), expiresAt: session.expiresAt.toISOString(), isCurrent: session.id === currentSessionId }));
}

export async function terminateConnectionSession(userId: string, sessionId: string, currentSessionId: string): Promise<{ id: string } | UserApiError> {
  if (sessionId === currentSessionId) return { status: 409, error: "You cannot terminate your current session." };
  const updated = await prisma.connectionSession.updateMany({ where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
  if (!updated.count) return { status: 404, error: "Active session not found." };
  return { id: sessionId };
}
