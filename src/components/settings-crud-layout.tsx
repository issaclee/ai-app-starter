"use client";

import { useEffect, useRef } from "react";

export type CrudPanelMode = "closed" | "view" | "create" | "edit";

export function SettingsCollectionLayout({ toolbar, children }: { toolbar: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col"><header className="shrink-0 border-b border-border bg-background px-5 py-5 sm:px-8">{toolbar}</header><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">{children}</div></div>;
}

export function SettingsDetailPanel({
  open,
  title,
  subtitle,
  badge,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open && !wasOpen.current) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => panelRef.current?.focus());
    }
    if (!open && wasOpen.current) returnFocusRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!open) return null;
  return (
    <section ref={panelRef} tabIndex={-1} aria-label={title} className="absolute inset-0 z-50 flex min-h-0 flex-col bg-background outline-none">
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-xl font-semibold">{title}</h2>{badge}</div>{subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">{footer}</div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8"><div className="mx-auto w-full max-w-4xl">{children}</div></div>
    </section>
  );
}

export function SettingsFieldGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="mb-8 last:mb-0"><div className="mb-4"><h3 className="text-sm font-semibold">{title}</h3>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div><div className="grid gap-5 sm:grid-cols-2">{children}</div></section>;
}
