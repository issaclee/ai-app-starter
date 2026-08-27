"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return <button type="button" className="grid size-10 place-items-center rounded-xl border border-border bg-panel text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label={mounted && resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{mounted && resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>;
}
