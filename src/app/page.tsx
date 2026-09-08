import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { getActiveSession } from "@/lib/app-session";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { appConfig } from "@/config/app";

const capabilities = [
  {
    icon: Users,
    eyebrow: "Your team",
    title: "People stay in control.",
    copy: "Give every role an intelligent partner that understands the work, keeps context, and knows when to ask.",
  },
  {
    icon: Bot,
    eyebrow: "Your agents",
    title: "Work moves on its own.",
    copy: "Deploy agents across finance, operations, and service to coordinate routine work from start to finish.",
  },
  {
    icon: Database,
    eyebrow: "Your data",
    title: "Decisions use the full picture.",
    copy: "Connect live business data to every workflow without separating intelligence from the systems people trust.",
  },
  {
    icon: BrainCircuit,
    eyebrow: "Your knowledge",
    title: "Experience becomes reusable.",
    copy: "Turn policies, process knowledge, and institutional memory into guidance that shows up at the right moment.",
  },
];

const workflowSteps = [
  ["01", "Sense", "Understand the request, context, and business state."],
  ["02", "Coordinate", "Bring the right people, agents, and systems together."],
  ["03", "Act", "Move work forward with clear controls and an audit trail."],
];

export default async function HomePage() {
  const session = await getActiveSession();
  const workspaceHref = session ? appConfig.routes.workspace : appConfig.routes.login;
  const currentYear = new Date().getFullYear();

  return (
    <main className="erp-landing min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-border bg-background/90 text-foreground backdrop-blur-xl dark:border-white/10 dark:bg-[#080b16]/90 dark:text-white">
        <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
          <Link href={appConfig.routes.home} className="inline-flex items-center" aria-label={`${appConfig.name} home`}>
            <BrandLogo />
          </Link>

          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex dark:text-slate-300">
            {appConfig.landing.navigation.map((item) => (
              <a className="transition hover:text-foreground dark:hover:text-white" href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>

          <ThemeToggle />
        </nav>
      </header>

      <section className="erp-hero relative bg-background text-foreground dark:bg-[#080b16] dark:text-white">
        <div className="erp-grid absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="erp-glow absolute left-[45%] top-[-12rem] h-[38rem] w-[38rem] rounded-full" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-sm text-brand dark:border-violet-300/20 dark:bg-violet-300/[0.07] dark:text-violet-100">
              <Sparkles size={14} /> {appConfig.landing.eyebrow}
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[5.25rem]">
              {appConfig.landing.headline} <span className="erp-gradient-text">{appConfig.landing.headlineAccent}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9 dark:text-slate-300">
              {appConfig.landing.supportingText}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={workspaceHref} className="erp-primary-cta">
                {session ? appConfig.landing.authenticatedAction : appConfig.landing.unauthenticatedAction}
                <ArrowRight size={17} />
              </Link>
              <a href={appConfig.landing.secondaryActionHref} className="erp-secondary-cta">
                {appConfig.landing.secondaryAction}
                <ChevronRight size={16} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground dark:text-slate-400">
              {appConfig.landing.trustPoints.map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <Check className="text-brand dark:text-violet-300" size={15} /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[35rem] lg:mx-0 lg:justify-self-end">
            <div className="absolute -inset-8 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />
            <div className="erp-console relative overflow-hidden rounded-[1.75rem] border border-border bg-panel/90 p-3 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-[#101426]/90 dark:shadow-black/40">
              <div className="rounded-[1.2rem] border border-border bg-background dark:border-white/10 dark:bg-[#0b0e1b]">
                <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-white/10">
                  <div>
                    <p className="text-sm font-medium">Operations intelligence</p>
                    <p className="mt-1 text-xs text-slate-500">Live workflow · Q4 planning</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" /> Active
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand dark:bg-violet-400/15 dark:text-violet-200"><Workflow size={18} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Rebalance supply plan</p>
                      <p className="truncate text-xs text-slate-500">12 signals analyzed across 4 systems</p>
                    </div>
                    <CircleDot className="ml-auto shrink-0 text-brand dark:text-violet-300" size={18} />
                  </div>

                  <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[1.1rem] before:top-5 before:w-px before:bg-border dark:before:bg-white/10">
                    {[
                      [Database, "Demand data", "Forecast updated"],
                      [BrainCircuit, "Planning agent", "3 scenarios compared"],
                      [Users, "Operations team", "Approval requested"],
                    ].map(([Icon, title, status], index) => {
                      const StepIcon = Icon as typeof Database;
                      return (
                        <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background p-3 dark:border-white/[0.07] dark:bg-white/[0.025]" key={title as string}>
                          <span className={`z-10 grid size-9 shrink-0 place-items-center rounded-full border ${index === 2 ? "border-brand/40 bg-brand-soft text-brand dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200" : "border-border bg-muted text-muted-foreground dark:border-white/10 dark:bg-[#15192a] dark:text-slate-400"}`}>
                            <StepIcon size={16} />
                          </span>
                          <div>
                            <p className="text-sm text-foreground dark:text-slate-200">{title as string}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground dark:text-slate-500">{status as string}</p>
                          </div>
                          {index < 2 && <Check className="ml-auto text-emerald-600 dark:text-emerald-300" size={16} />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-violet-400 px-4 py-3 text-sm font-medium text-[#0a0c16]">
                    Review recommended plan <ArrowRight size={17} />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 shadow-xl sm:flex dark:border-white/10 dark:bg-[#171b2e]">
              <span className="grid size-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-300/15 dark:text-emerald-300"><Check size={16} /></span>
              <div><p className="text-xs font-medium text-foreground dark:text-white">Workflow complete</p><p className="text-[0.7rem] text-muted-foreground dark:text-slate-500">42 minutes saved</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">One connected operating layer</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Everything your business knows, finally working together.</h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2">
            {capabilities.map(({ icon: Icon, eyebrow, title, copy }) => (
              <article className="group bg-background p-7 transition hover:bg-brand-soft/40 sm:p-9" key={eyebrow}>
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={21} /></span>
                  <span className="font-mono text-xs text-muted-foreground">{eyebrow}</span>
                </div>
                <h3 className="mt-10 text-xl font-semibold tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 max-w-md leading-7 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-muted/35 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">How it works</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Intelligence in the flow of work.</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">Agentic ERP turns fragmented steps into a connected loop that learns, coordinates, and acts with your team.</p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {workflowSteps.map(([number, title, copy]) => (
              <article className="grid gap-4 py-7 sm:grid-cols-[4rem_9rem_1fr] sm:items-baseline" key={number}>
                <span className="font-mono text-sm text-brand">{number}</span>
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="leading-7 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#111528] px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
            <div className="erp-grid absolute inset-0 opacity-20" aria-hidden="true" />
            <div className="relative grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                <span className="mb-6 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200"><ShieldCheck size={24} /></span>
                <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Built for the work your business depends on.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Keep your data governed, your people accountable, and every agent action visible—from the first signal to the final decision.</p>
              </div>
              <Link href={workspaceHref} className="erp-primary-cta shrink-0">
                Start now <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© Copyright {currentYear} {appConfig.company}</p>
          <p>{appConfig.landing.footerTagline}</p>
        </div>
      </footer>
    </main>
  );
}
