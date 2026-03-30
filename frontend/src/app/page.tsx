import Link from "next/link";
import { Activity, HeartPulse, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            ICARE<span className="text-emerald-600 dark:text-emerald-400">‑</span>CVD
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
          <p className="mb-4 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Cardiovascular care, clearer insights
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            Support heart health with a focused, modern care platform
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            ICARE‑CVD helps you organize risk factors, follow‑ups, and patient
            education in one place—built for clarity and everyday clinical
            workflows.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create an account
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:grid-cols-3 sm:gap-8 sm:px-6">
            <article className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <HeartPulse className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Heart‑focused overview
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Surface blood pressure, lipids, and lifestyle signals in a
                structured view so nothing important slips through.
              </p>
            </article>
            <article className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Activity className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Trends you can trust
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Track changes over time with simple charts and reminders tied to
                follow‑up windows.
              </p>
            </article>
            <article className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Shield className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Built for safe workflows
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Authentication, clear roles, and a path to audit‑friendly
                records as your graduation project grows.
              </p>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 px-6 py-12 text-center text-white shadow-lg sm:px-12 sm:py-14 dark:border-zinc-800">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to explore ICARE‑CVD?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-300">
              Sign up to try the app, or sign in if your team already has
              access.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 sm:w-auto"
              >
                Register
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/25 bg-transparent px-6 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-zinc-500 sm:flex-row sm:px-6 sm:text-left">
          <span>ICARE‑CVD — graduation project</span>
          <span className="text-xs sm:text-sm">
            Educational prototype — not a medical device
          </span>
        </div>
      </footer>
    </div>
  );
}
