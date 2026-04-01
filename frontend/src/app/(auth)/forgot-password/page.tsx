"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-10 dark:bg-zinc-950">
      <section className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            <KeyRound className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Forgot password?
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-400">
              Enter your email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-11 rounded-none border-0 border-b border-zinc-300 bg-transparent px-0 focus-visible:ring-0 dark:border-zinc-700"
            />
          </div>

          <Button
            className="h-11 w-full text-base"
            type="button"
            onClick={() => router.push("/otp")}
          >
            Reset password
          </Button>
        </form>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-lg font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to log in
          </Link>
        </div>
      </section>
    </main>
  );
}
