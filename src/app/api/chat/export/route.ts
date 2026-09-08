import { z } from "zod";
import { getActiveSession } from "@/lib/app-session";
import { exportResponse } from "@/lib/response-export";

export const runtime = "nodejs";

const exportSchema = z.object({
  content: z.string().min(1).max(100_000),
  format: z.enum(["md", "pdf", "docx"]),
});

export async function POST(request: Request) {
  const session = await getActiveSession();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid export request." }, { status: 400 });

  try {
    const exported = await exportResponse(parsed.data.content, parsed.data.format);
    const responseBody = exported.body.buffer.slice(
      exported.body.byteOffset,
      exported.body.byteOffset + exported.body.byteLength,
    ) as ArrayBuffer;
    return new Response(responseBody, {
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Response export failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The response could not be exported. Please try again." }, { status: 500 });
  }
}
