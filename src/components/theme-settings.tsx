"use client";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ThemeSettings() {
  const { theme, setTheme } = useTheme(); const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return <div className="rounded-2xl border border-border bg-panel p-4"><label htmlFor="theme" className="mb-2 block text-sm font-medium">Color theme</label><select id="theme" className="field" value={mounted ? theme : "system"} onChange={(event) => setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>;
}
