import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getActiveSession } from "@/lib/app-session";
import { currentProvider } from "@/lib/llm";
import { SessionHeartbeat } from "@/components/session-heartbeat";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getActiveSession();
  if (!session?.user) redirect("/login");
  const provider = currentProvider();
  return <><SessionHeartbeat /><WorkspaceShell user={{ name: session.user.name ?? "User", email: session.user.email ?? "", role: session.user.role ?? "USER" }} provider={{ name: provider, configured: provider !== "unconfigured" }}>{children}</WorkspaceShell></>;
}
