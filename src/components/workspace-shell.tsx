"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ellipsis,
  Menu,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileView } from "@/components/profile-view";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { groupChatHistory, type ChatSummary, type HistoryGroup } from "@/lib/chat-history";

type Props = {
  user: { name: string; email: string; role: "ADMIN" | "USER" };
  provider: { name: string; configured: boolean };
  children: React.ReactNode;
};

export function WorkspaceShell({ user, provider, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [history, setHistory] = useState<ChatSummary[]>([]);
  const [historyMenuOpen, setHistoryMenuOpen] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(user);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-history-menu]")) setHistoryMenuOpen(null);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHistoryMenuOpen(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      try {
        const response = await fetch("/api/chats", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { chats: ChatSummary[] };
        if (active) setHistory(data.chats);
      } catch {
        // Keep navigation usable when history is temporarily unavailable.
      }
    }
    const refresh = () => { void loadHistory(); };
    void loadHistory();
    window.addEventListener("plainchat:history-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("plainchat:history-changed", refresh);
    };
  }, []);

  function startNewChat() {
    router.push("/chat");
    setMobileOpen(false);
    setProfileOpen(false);
    window.dispatchEvent(new Event("plainchat:new"));
  }

  async function renameChat(chat: ChatSummary) {
    setHistoryMenuOpen(null);
    const title = window.prompt("Rename chat", chat.title)?.trim();
    if (!title || title === chat.title) return;
    const response = await fetch(`/api/chats/${encodeURIComponent(chat.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (response.ok) {
      const updated = await response.json() as ChatSummary;
      setHistory((current) => current.map((item) => item.id === chat.id ? updated : item));
    }
  }

  async function deleteChat(chat: ChatSummary) {
    setHistoryMenuOpen(null);
    if (!window.confirm(`Delete “${chat.title}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/chats/${encodeURIComponent(chat.id)}`, { method: "DELETE" });
    if (!response.ok) return;
    setHistory((current) => current.filter((item) => item.id !== chat.id));
    if (pathname === `/chat/${chat.id}`) router.push("/chat");
  }

  async function deleteHistoryGroup(ids: string[]) {
    setHistoryMenuOpen(null);
    if (!ids.length || !window.confirm("Delete all chats from Previous 30 days? This cannot be undone.")) return;
    const response = await fetch("/api/chats/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) return;
    setHistory((current) => current.filter((chat) => !ids.includes(chat.id)));
    if (ids.some((id) => pathname === `/chat/${id}`)) router.push("/chat");
  }

  const groupedHistory = groupChatHistory(history);
  const historyLabels: Record<HistoryGroup, string> = {
    current: "Current",
    yesterday: "Yesterday",
    previous30: "Previous 30 days",
  };

  function historyMenuButton(key: string) {
    return {
      onClick: (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setHistoryMenuOpen((current) => current === key ? null : key);
      },
      onContextMenu: (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setHistoryMenuOpen(key);
      },
    };
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between px-3">
        <Link href="/" className="flex items-center gap-2 overflow-hidden font-semibold">
          <BrandLogo />
        </Link>
        <button
          className="hidden size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:grid"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
        <button
          className="grid size-9 place-items-center rounded-lg md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pt-1">
        <button onClick={startNewChat} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted">
          <MessageSquarePlus size={17} /> New chat
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Chat history">
        {(Object.keys(groupedHistory) as HistoryGroup[]).map((group) => {
          const chats = groupedHistory[group];
          if (!chats.length) return null;
          const groupMenuKey = `group:${group}`;
          return (
            <section className="mb-5" key={group}>
              <div className="mb-1 flex min-h-8 items-center justify-between px-3">
                <p className="text-xs font-medium text-muted-foreground">{historyLabels[group]}</p>
                {group === "previous30" && (
                  <div className="relative" data-history-menu>
                    <button
                      type="button"
                      aria-label="Previous 30 days actions"
                      aria-haspopup="menu"
                      aria-expanded={historyMenuOpen === groupMenuKey}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      {...historyMenuButton(groupMenuKey)}
                    >
                      <Ellipsis size={16} />
                    </button>
                    {historyMenuOpen === groupMenuKey && (
                      <div role="menu" className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-border bg-panel p-1.5 shadow-xl">
                        <button type="button" role="menuitem" onClick={() => void deleteHistoryGroup(chats.map((chat) => chat.id))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand-danger hover:bg-muted">
                          <Trash2 size={15} /> Delete all
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                {chats.map((chat) => {
                  const itemMenuKey = `chat:${chat.id}`;
                  const active = pathname === `/chat/${chat.id}`;
                  return (
                    <div className="group/chat relative" data-history-menu key={chat.id}>
                      <Link
                        href={`/chat/${chat.id}`}
                        onClick={() => { setMobileOpen(false); setHistoryMenuOpen(null); }}
                        className={`flex min-h-9 items-center gap-2 rounded-lg py-2 pl-3 pr-9 text-sm ${active ? "bg-brand-secondary/30 font-medium text-brand" : "hover:bg-muted"}`}
                      >
                        <MessageSquareText size={15} className="shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`Actions for ${chat.title}`}
                        aria-haspopup="menu"
                        aria-expanded={historyMenuOpen === itemMenuKey}
                        className={`absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-sidebar text-muted-foreground hover:bg-muted hover:text-foreground ${historyMenuOpen === itemMenuKey ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover/chat:opacity-100 sm:focus:opacity-100"}`}
                        {...historyMenuButton(itemMenuKey)}
                      >
                        <Ellipsis size={16} />
                      </button>
                      {historyMenuOpen === itemMenuKey && (
                        <div role="menu" className="absolute right-1 top-9 z-40 w-36 rounded-xl border border-border bg-panel p-1.5 shadow-xl">
                          <button type="button" role="menuitem" onClick={() => void renameChat(chat)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
                            <Pencil size={14} /> Rename
                          </button>
                          <button type="button" role="menuitem" onClick={() => void deleteChat(chat)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand-danger hover:bg-muted">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <SidebarAccountMenu
        user={profileUser}
        onOpenProfile={() => { setProfileOpen(true); setMobileOpen(false); }}
        onNavigate={() => { setProfileOpen(false); setMobileOpen(false); }}
      />
    </>
  );

  if (pathname === "/settings") return children;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={`relative hidden shrink-0 flex-col overflow-hidden bg-sidebar transition-[width] duration-200 md:flex ${
          collapsed ? "w-0" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative flex h-full w-[min(84vw,290px)] flex-col bg-sidebar shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              className="grid size-10 place-items-center rounded-lg hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={19} />
            </button>
            {collapsed && (
              <button
                className="hidden size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:grid"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={19} />
              </button>
            )}
          </div>
          <ThemeToggle />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        {profileOpen && <ProfileView name={profileUser.name} email={profileUser.email} provider={provider.name} providerConfigured={provider.configured} onClose={() => setProfileOpen(false)} onSaved={(saved) => { setProfileUser((current) => ({ ...current, ...saved })); router.refresh(); }} />}
      </div>
    </div>
  );
}
