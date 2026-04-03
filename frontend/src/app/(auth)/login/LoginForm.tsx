"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { InfoIcon, Lock, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useLogin } from "./useLogin";

export function LoginForm() {
  const { submit, fieldErrors, isPending, serverErrorMessage } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email, password });
  }

  return (
    <Card className="w-full max-w-md border border-zinc-200/90 bg-white shadow-none dark:border-zinc-700/80 dark:bg-zinc-900">
      <CardHeader className="space-y-2 px-8 pb-4 pt-8 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Account access
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back!
        </CardTitle>
        <CardDescription className="text-[15px] text-zinc-500 dark:text-zinc-400">
          Simplify your workflow and boost your productivity with ICARE-CVD. Get
          started for free.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-5 px-8 pb-2 pt-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="login-email"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                disabled={isPending}
                className="h-10 rounded-lg border-zinc-300 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="login-password"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                disabled={isPending}
                className="h-10 rounded-lg border-zinc-300 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {fieldErrors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          {serverErrorMessage ? (
            <Alert
              variant="destructive"
              className="mt-1 border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-200"
            >
              <InfoIcon className="mt-0.5 size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <div className="mt-1 flex items-center justify-between gap-2 text-sm">
            <label className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 outline-none ring-offset-0 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-0 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-zinc-800 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-200 dark:hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 bg-transparent px-8 pb-8 pt-6 dark:border-zinc-800">
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 w-full rounded-lg border-0 bg-zinc-950 text-sm font-medium text-white shadow-none hover:bg-zinc-900 focus-visible:ring-zinc-400/40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
          <div className="space-y-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-zinc-900 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-50"
              >
                Create an account
              </Link>
            </p>
            <p>
              Need context first?{" "}
              <Link
                href="/about"
                className="font-medium text-zinc-900 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-50"
              >
                Read about this app.
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
