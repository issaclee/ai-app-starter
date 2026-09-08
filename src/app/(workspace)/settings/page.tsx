import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsWorkspace } from "@/components/settings-workspace";
import { getActiveSession } from "@/lib/app-session";
import { getSettingsBootstrap } from "@/lib/user-management";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getActiveSession();
  if (!session?.user) redirect("/login");
  const { isAdmin, users } = await getSettingsBootstrap(session.user.localUserId);
  if (!isAdmin) redirect("/chat");

  return (
    <SettingsWorkspace
      currentUserId={session.user.localUserId}
      initialUsers={users}
    />
  );
}
