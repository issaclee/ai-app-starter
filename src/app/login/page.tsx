import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage() {
  if (await auth()) redirect("/chat");
  return <main className="grid min-h-screen bg-background md:grid-cols-[.9fr_1.1fr]">
    <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10"><header className="flex items-center justify-between"><Link href="/"><BrandLogo /></Link><ThemeToggle /></header><div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><div className="w-full"><p className="text-sm font-medium text-brand">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your workspace</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Use your local account to continue. Workspace OAuth can be enabled later.</p><LoginForm /></div></div></section>
    <aside className="hidden bg-[#172033] p-12 text-white md:flex md:flex-col md:justify-end"><div className="max-w-lg"><div className="mb-8 h-px w-16 bg-[#7894ff]" /><blockquote className="text-3xl font-medium leading-tight tracking-tight">A simple, secure starter for AI powered applications.</blockquote><p className="mt-5 text-sm leading-6 text-slate-300">Start in echo mode, then connect the model provider that fits your environment.</p></div></aside>
  </main>;
}
