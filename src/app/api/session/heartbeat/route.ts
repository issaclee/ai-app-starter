import { getActiveSession } from "@/lib/app-session";

export async function GET() {
  return await getActiveSession() ? new Response(null, { status: 204 }) : Response.json({ error: "Unauthorized" }, { status: 401 });
}
