import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceShell } from "@/components/workspace-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <WorkspaceShell user={{ name: session.user.name ?? "User", email: session.user.email ?? "" }}>{children}</WorkspaceShell>;
}
