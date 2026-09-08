import { listConnectionSessions } from "@/lib/connection-sessions";
import { requireAdmin } from "@/lib/user-management";

function isError(value: unknown): value is { status: number; error: string } { return Boolean(value && typeof value === "object" && "status" in value && "error" in value); }

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const access = await requireAdmin();
  if (isError(access)) return Response.json({ error: access.error }, { status: access.status });
  const { userId } = await params;
  const result = await listConnectionSessions(userId, access.sessionId);
  if (isError(result)) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ sessions: result });
}
