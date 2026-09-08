import { deleteManagedUser, requireAdmin, updateManagedUser } from "@/lib/user-management";

type Context = { params: Promise<{ userId: string }> };

function isApiError(value: unknown): value is { status: number; error: string; fieldErrors?: Record<string, string[]> } {
  return Boolean(value && typeof value === "object" && "status" in value && "error" in value);
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireAdmin();
  if (isApiError(access)) return Response.json({ error: access.error }, { status: access.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }

  const { userId } = await params;
  const result = await updateManagedUser(userId, body, access.userId);
  if (isApiError(result)) return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  return Response.json({ user: result });
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await requireAdmin();
  if (isApiError(access)) return Response.json({ error: access.error }, { status: access.status });

  const { userId } = await params;
  const result = await deleteManagedUser(userId, access.userId);
  if (isApiError(result)) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}
