import { handleChatRequest } from "@/lib/chat-handler";
import { getActiveSession } from "@/lib/app-session";
import { generateReplyStream } from "@/lib/llm";

export async function POST(request: Request) {
  return handleChatRequest(request, { getSession: getActiveSession, reply: generateReplyStream });
}
