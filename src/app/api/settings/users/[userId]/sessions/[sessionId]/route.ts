import { terminateConnectionSession } from "@/lib/connection-sessions";
import { requireAdmin } from "@/lib/user-management";

function isError(value: unknown): value is { status: number; error: string } { return Boolean(value && typeof value === "object" && "status" in value && "error" in value); }

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string; sessionId: string }> }) {
  const access = await requireAdmin();
  if (isError(access)) return Response.json({ error: access.error }, { status: access.status });
  const { userId, sessionId } = await params;
  const result = await terminateConnectionSession(userId, sessionId, access.sessionId);
  if (isError(result)) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
