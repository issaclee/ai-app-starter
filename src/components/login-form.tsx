"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { GoogleIcon, MicrosoftIcon } from "@/components/oauth-provider-icons";

type Provider = "credentials" | "google" | "microsoft";

function safeCallbackUrl(requested: string | null) {
  return requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/chat";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const displayedError = error || (searchParams.get("error")
    ? "Authentication could not be completed. Please try again."
    : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPendingProvider("credentials");
    const form = new FormData(event.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: String(form.get("email")),
        password: String(form.get("password")),
        redirect: false,
        redirectTo: callbackUrl,
      });
      if (result?.error) {
        setError("Invalid username or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setPendingProvider(null);
    }
  }

  async function startOAuth(provider: "google" | "microsoft") {
    setError("");
    setPendingProvider(provider);
    try {
      await signIn(provider, { redirectTo: callbackUrl });
    } catch {
      setError("Authentication could not be completed. Please try again.");
      setPendingProvider(null);
    }
  }

  const pending = pendingProvider !== null;

  return (
    <>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">Username</label>
          <input className="field" id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
          <input className="field" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {displayedError && (
          <p role="alert" className="rounded-xl bg-brand-danger/15 px-3 py-2.5 text-sm text-brand-danger">
            {displayedError}
          </p>
        )}
        <button disabled={pending} className="button-primary w-full" type="submit">
          {pendingProvider === "credentials" && <LoaderCircle className="animate-spin" size={16} />}
          {pendingProvider === "credentials" ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Or continue sign-in with
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={pending}
          className="button-secondary"
          onClick={() => startOAuth("google")}
        >
          {pendingProvider === "google" ? <LoaderCircle className="animate-spin" size={16} /> : <GoogleIcon className="size-4" />}
          Google
        </button>
        <button
          type="button"
          disabled={pending}
          className="button-secondary"
          onClick={() => startOAuth("microsoft")}
        >
          {pendingProvider === "microsoft" ? <LoaderCircle className="animate-spin" size={16} /> : <MicrosoftIcon className="size-4" />}
          Microsoft
        </button>
      </div>
    </>
  );
}
