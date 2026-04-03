"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, InfoIcon, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useResetPassword } from "./useResetPassword";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { submit, fieldErrors, isPending, isSuccess, successMessage, serverErrorMessage } =
    useResetPassword(token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ password, confirmPassword });
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-0 pt-7 text-center">
        <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create New Password
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
          Choose a new secure password for your account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-8 pt-5">
          <div className="space-y-2">
            <Label
              htmlFor="reset-password"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              New Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="reset-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "reset-password-error" : undefined}
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
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>

            {fieldErrors.password ? (
              <p id="reset-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reset-confirm-password"
              className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Confirm Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? "reset-confirm-password-error" : undefined
                }
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 pr-10 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={isPending}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>

            {fieldErrors.confirmPassword ? (
              <p id="reset-confirm-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {isSuccess ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Password updated</AlertTitle>
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
            {isPending ? "Updating..." : "Update Password"}
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
