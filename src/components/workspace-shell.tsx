"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  LogOut,
  Menu,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  user: { name: string; email: string };
  children: React.ReactNode;
};

export function WorkspaceShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
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

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function startNewChat() {
    router.push("/chat");
    setMobileOpen(false);
    window.dispatchEvent(new Event("plainchat:new"));
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

      <nav className="flex-1 px-3 py-5" aria-label="Workspace">
        <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">Chats</p>
        <Link
          href="/chat"
          onClick={() => setMobileOpen(false)}
          className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm ${
            pathname === "/chat" ? "bg-brand-secondary/30 font-medium text-brand" : "hover:bg-muted"
          }`}
        >
          <MessageSquareText size={16} />
          <span className="truncate">Current conversation</span>
        </Link>
      </nav>

      <div className="relative p-2" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-[68px] left-2 right-2 z-30 rounded-2xl border border-border bg-panel p-1.5 shadow-xl">
            <Link
              href="/settings"
              onClick={() => { setMenuOpen(false); setMobileOpen(false); }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
            >
              <Settings size={16} /> Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-emphasis text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <ChevronDown size={15} className="text-muted-foreground" />
        </button>
      </div>
    </>
  );

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

      <div className="flex min-w-0 flex-1 flex-col">
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
            <p className="text-sm font-medium">{pathname === "/settings" ? "Settings" : "AIAppStarter"}</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
