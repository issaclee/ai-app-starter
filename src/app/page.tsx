import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, LockKeyhole, LogIn, MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const session = await auth();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2"><ThemeToggle /><Link className="button-secondary" href={session ? "/chat" : "/login"}><LogIn size={16} /> {session ? "Open chat" : "Log in"}</Link></div>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-28">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" /> Private by default. Provider-flexible.</div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">A focused place to think with AI.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Connect an OpenAI-compatible endpoint or a local Ollama model. One calm interface, built for useful conversations.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={session ? "/chat" : "/login"} className="button-primary">{session ? "Continue chatting" : "Get started"} <ArrowRight size={17} /></Link><a href="#capabilities" className="button-secondary">Learn more</a></div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Server-side model access", "Local model ready", "Light and dark themes"].map((item) => <li className="flex items-center gap-2" key={item}><CheckCircle2 size={15} className="text-emerald-500" />{item}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-panel p-3 shadow-2xl shadow-slate-950/10">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-8 flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><Bot size={19} /></span><div><p className="text-sm font-medium">New conversation</p><p className="text-xs text-muted-foreground">Echo mode ready</p></div></div><span className="size-2 rounded-full bg-emerald-500" /></div>
            <div className="space-y-4"><div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm text-white">Help me outline a project brief.</div><div className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-6">Echo mode is working. Configure OpenAI or Ollama whenever you are ready.</div></div>
            <div className="mt-10 flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">Ask anything…<ArrowRight className="ml-auto" size={17} /></div>
          </div>
        </div>
      </section>
      <section id="capabilities" className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 md:grid-cols-3">
          {[
            [LockKeyhole, "Authenticated", "A protected workspace with credentials stored as secure password hashes."],
            [Bot, "Provider-flexible", "Choose OpenAI or Ollama with environment variables; no browser-side secrets."],
            [MessageSquareText, "Safe to start", "No model configured? Echo mode keeps the entire interface functional."],
          ].map(([Icon, title, copy]) => { const FeatureIcon = Icon as typeof Bot; return <article key={title as string} className="rounded-2xl border border-border bg-background p-6"><FeatureIcon className="mb-5 text-brand" size={22} /><h2 className="font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy as string}</p></article>; })}
        </div>
      </section>
    </main>
  );
}
