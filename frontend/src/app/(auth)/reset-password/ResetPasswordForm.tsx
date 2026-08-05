"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ResetPasswordValues } from "./reset-password.types";

export type ResetPasswordFormProps = {
  submit: (values: ResetPasswordValues) => void;
  fieldErrors: Partial<Record<keyof ResetPasswordValues, string>>;
  isPending: boolean;
  isSuccess: boolean;
  successMessage: string;
  serverErrorMessage: string | null;
};

export function ResetPasswordForm({
  submit,
  fieldErrors,
  isPending,
  isSuccess,
  successMessage,
  serverErrorMessage,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ password, confirmPassword });
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-[0_4px_30px_-4px_rgba(26,83,69,0.10)]">
      <CardHeader className="space-y-2 pb-0 pt-7 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-[#152A24]">
          Create New Password
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Choose a new secure password for your account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-8 pt-5">
          <div className="space-y-2">
            <Label
              htmlFor="reset-password"
              className="text-left text-sm font-medium text-[#374151]"
            >
              New Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
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
                className="h-11 rounded-xl border-gray-200 bg-white pl-9 pr-10 text-[#152A24] placeholder:text-gray-400 focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
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
              <p id="reset-password-error" className="text-sm text-[#E15C5C]" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reset-confirm-password"
              className="text-left text-sm font-medium text-[#374151]"
            >
              Confirm Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
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
                className="h-11 rounded-xl border-gray-200 bg-white pl-9 pr-10 text-[#152A24] placeholder:text-gray-400 focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
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
              <p id="reset-confirm-password-error" className="text-sm text-[#E15C5C]" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {isSuccess ? (
            <Alert className="border-[#1A5345]/40 bg-[#1A5345]/10 text-[#1A5345]">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {serverErrorMessage ? (
            <Alert className="border-[#E15C5C]/40 bg-[#E15C5C]/10 text-[#E15C5C]">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="h-11 w-full rounded-xl bg-[#1A5345] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(26,83,69,0.30)] hover:bg-[#1A5345]/90 focus-visible:ring-[#1A5345]/40"
          >
            {isPending ? "Updating..." : "Update Password"}
          </Button>

          <Button
            asChild
            variant="link"
            className="h-auto w-full px-0 text-sm text-gray-500 hover:text-[#1A5345]"
          >
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
