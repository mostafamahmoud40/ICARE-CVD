"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Heart, InfoIcon, Lock, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import type { LoginValues } from "./login.types";

export type LoginFormProps = {
  submit: (values: LoginValues) => void;
  fieldErrors: Partial<Record<keyof LoginValues, string>>;
  isPending: boolean;
  serverErrorMessage: string | null;
};

export function LoginForm({ submit, fieldErrors, isPending, serverErrorMessage }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email, password });
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300">
          <Heart className="size-8 fill-current" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your CareSmart account
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-0 pt-5">
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email Address
            </Label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            {fieldErrors.email ? (
              <p id="login-email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
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
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 pr-10 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>

            {fieldErrors.password ? (
              <p id="login-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button
              asChild
              variant="link"
              className="h-auto px-0 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <Link href="/forgot-password">Forgot password?</Link>
            </Button>
          </div>

          {serverErrorMessage ? (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-200"
            >
              <InfoIcon className="mt-0.5 size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="h-12 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-none hover:bg-teal-600 focus-visible:ring-teal-400/40 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {isPending ? (
              <>
                <span
                  className="mr-2 size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
                  aria-hidden="true"
                />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex-col gap-6 border-t-0 bg-transparent p-0 px-8 pb-8 pt-6">
          <div className="relative w-full">
            <Separator />
            <span className="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-sm">
              Don&apos;t have an account?
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-xl border-teal-200 bg-transparent text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 dark:hover:text-teal-200"
          >
            <Link href="/register">Create Account</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
