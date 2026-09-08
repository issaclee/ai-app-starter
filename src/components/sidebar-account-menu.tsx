"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  user: { name: string; email: string; role: "ADMIN" | "USER" };
  onOpenProfile: () => void;
  onNavigate?: () => void;
};

export function SidebarAccountMenu({ user, onOpenProfile, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function closeAndNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div className="relative p-2" ref={menuRef}>
      {open && (
        <div role="menu" className="absolute bottom-[68px] left-2 right-2 z-30 rounded-2xl border border-border bg-panel p-1.5 shadow-xl">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted"
          >
            <UserRound size={16} /> Profile
          </button>
          {user.role === "ADMIN" && (
            <Link
              href="/settings"
              role="menuitem"
              onClick={closeAndNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
            >
              <Settings size={16} /> Settings
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeAndNavigate();
              void signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open account menu"
        aria-expanded={open}
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
  );
}
