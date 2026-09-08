import { createManagedUser, listManagedUsers, requireAdmin } from "@/lib/user-management";

function isApiError(value: unknown): value is { status: number; error: string; fieldErrors?: Record<string, string[]> } {
  return Boolean(value && typeof value === "object" && "status" in value && "error" in value);
}

export async function GET() {
  const access = await requireAdmin();
  if (isApiError(access)) return Response.json({ error: access.error }, { status: access.status });
  return Response.json({ users: await listManagedUsers() });
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (isApiError(access)) return Response.json({ error: access.error }, { status: access.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }

  const result = await createManagedUser(body);
  if (isApiError(result)) return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  return Response.json({ user: result }, { status: 201 });
}
