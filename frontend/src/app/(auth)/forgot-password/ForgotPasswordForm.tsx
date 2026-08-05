"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ForgotPasswordValues } from "./forgot-password.types";

export type ForgotPasswordFormProps = {
  submit: (values: ForgotPasswordValues) => void;
  fieldErrors: Partial<Record<keyof ForgotPasswordValues, string>>;
  isPending: boolean;
};

export function ForgotPasswordForm({
  submit,
  fieldErrors,
  isPending,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email });
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-[0_4px_30px_-4px_rgba(26,83,69,0.10)]">
      <CardHeader className="space-y-5 pb-2 pt-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full" style={{ background: "#1A534518" }}>
          <Fingerprint className="size-7 text-[#1A5345]" strokeWidth={1.5} />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#152A24]">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            No worries, we&apos;ll send you reset instructions.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-6 px-8 pb-8 pt-6">
          <div className="space-y-2">
            <Label
              htmlFor="forgot-password-email"
              className="text-sm font-medium text-[#374151]"
            >
              Email
            </Label>

            <Input
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "forgot-password-email-error" : undefined}
              disabled={isPending}
              className="h-11 rounded-xl border-gray-200 bg-white text-[#152A24] placeholder:text-gray-400 focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
            />
            {fieldErrors.email ? (
              <p id="forgot-password-email-error" className="text-sm text-[#E15C5C]" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-[#1A5345] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(26,83,69,0.30)] hover:bg-[#1A5345]/90 focus-visible:ring-[#1A5345]/40"
          >
            {isPending ? "Sending..." : "Reset password"}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-500 hover:text-[#1A5345]"
            >
              ← Back to log in
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
