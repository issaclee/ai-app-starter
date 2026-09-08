"use client";

import { useEffect } from "react";

export function SessionHeartbeat() {
  useEffect(() => {
    let stopped = false;
    async function check() {
      try {
        const response = await fetch("/api/session/heartbeat", { cache: "no-store" });
        if (!stopped && response.status === 401) {
          const callbackUrl = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      } catch {}
    }
    const timer = window.setInterval(check, 30_000);
    function visible() { if (document.visibilityState === "visible") void check(); }
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  return null;
}
