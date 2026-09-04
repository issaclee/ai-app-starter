import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage() {
  if (await auth()) redirect("/chat");
  return <main className="grid min-h-screen bg-background md:grid-cols-[.9fr_1.1fr]">
    <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10"><header className="flex items-center justify-between"><Link href="/"><BrandLogo /></Link><ThemeToggle /></header><div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><div className="w-full"><p className="text-sm font-medium text-brand">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your workspace</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Use your local account to continue.</p><LoginForm /></div></div></section>
    <aside className="relative hidden overflow-hidden p-12 text-white md:flex md:flex-col md:justify-end"><Image src="/images/background/bg-sf.png" alt="" fill priority sizes="55vw" className="object-cover object-center" /><div className="absolute inset-0 bg-slate-950/35" /><div className="relative max-w-lg"><div className="mb-8 h-px w-16 bg-[#98bdff]" /><blockquote className="text-3xl font-medium leading-tight tracking-tight">A simple, secure starter for AI powered applications.</blockquote></div></aside>
  </main>;
}
