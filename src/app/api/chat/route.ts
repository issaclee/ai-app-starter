import { auth } from "@/auth";
import { handleChatRequest } from "@/lib/chat-handler";
import { generateReply } from "@/lib/llm";

export async function POST(request: Request) {
  return handleChatRequest(request, { getSession: auth, reply: generateReply });
}
