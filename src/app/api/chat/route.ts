import { auth } from "@/auth";
import { handleChatRequest } from "@/lib/chat-handler";
import { generateReplyStream } from "@/lib/llm";

export async function POST(request: Request) {
  return handleChatRequest(request, { getSession: auth, reply: generateReplyStream });
}
