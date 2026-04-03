"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, InfoIcon, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForgotPassword } from "./useForgotPassword";

export function ForgotPasswordForm() {
  const { submit, fieldErrors, isPending, isSuccess, successMessage, serverErrorMessage } =
    useForgotPassword();
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email });
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-0 pt-7 text-center">
        <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email and we&apos;ll send you reset instructions.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-8 pt-5">
          <div className="space-y-2">
            <Label
              htmlFor="forgot-password-email"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email Address
            </Label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "forgot-password-email-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            {fieldErrors.email ? (
              <p id="forgot-password-email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          {isSuccess ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Request sent</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

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
            {isPending ? "Sending..." : "Send reset link"}
          </Button>

          <Button
            asChild
            variant="link"
            className="h-auto w-full px-0 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
