import { updateCurrentProfile } from "@/lib/profile-management";

function isApiError(value: unknown): value is { status: number; error: string; fieldErrors?: Record<string, string[]> } {
  return Boolean(value && typeof value === "object" && "status" in value && "error" in value);
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const result = await updateCurrentProfile(body);
  if (isApiError(result)) {
    return Response.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  }
  return Response.json({ profile: result });
}
