"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Globe2, LoaderCircle, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const form = new FormData(event.currentTarget); const requested = searchParams.get("callbackUrl");
    const callbackUrl = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/chat";
    try {
      const result = await signIn("credentials", { email: String(form.get("email")), password: String(form.get("password")), redirect: false });
      if (result?.error) setError("Invalid username or password."); else { router.push(callbackUrl); router.refresh(); }
    } catch { setError("Unable to sign in right now. Please try again."); } finally { setPending(false); }
  }
  return <><form onSubmit={submit} className="mt-8 space-y-4"><div><label htmlFor="email" className="mb-2 block text-sm font-medium">Username</label><input className="field" id="email" name="email" type="email" autoComplete="username" defaultValue="admin@mptwork.local" required /></div><div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input className="field" id="password" name="password" type="password" autoComplete="current-password" required /></div>{error && <p role="alert" className="rounded-xl bg-brand-danger/15 px-3 py-2.5 text-sm text-brand-danger">{error}</p>}<button disabled={pending} className="button-primary w-full" type="submit">{pending && <LoaderCircle className="animate-spin" size={16} />}{pending ? "Signing in…" : "Sign in"}</button></form><div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />Workspace sign-in<span className="h-px flex-1 bg-border" /></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled className="button-secondary opacity-50" title="Google OAuth is not configured"><Globe2 size={16} />Google <span className="sr-only">Coming soon</span></button><button type="button" disabled className="button-secondary opacity-50" title="Microsoft OAuth is not configured"><Mail size={16} />Microsoft <span className="sr-only">Coming soon</span></button></div><p className="mt-3 text-center text-xs text-muted-foreground">Google and Microsoft sign-in are not configured.</p></>;
}
