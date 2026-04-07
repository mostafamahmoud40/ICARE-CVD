"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, InfoIcon, KeyRound, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

export type OtpCodeFormProps = {
  submit: (code: string) => void;
  resend: () => void;
  fieldError: string | null;
  isPending: boolean;
  isSuccess: boolean;
  successMessage: string;
  resendMessage: string | null;
  isResending: boolean;
  serverErrorMessage: string | null;
};

export function OtpCodeForm({
  submit,
  resend,
  fieldError,
  isPending,
  isSuccess,
  successMessage,
  resendMessage,
  isResending,
  serverErrorMessage,
}: OtpCodeFormProps) {
  const [otp, setOtp] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit(otp);
  }

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300">
          <KeyRound className="size-8" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Verify your login
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter the verification code we sent to your email address:{" "}
            <span className="font-medium text-foreground">m@example.com</span>.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-0 pt-5">
          <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="otp-verification" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Verification code
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-lg"
              onClick={() => resend()}
              disabled={isResending || isPending}
            >
              <RefreshCwIcon />
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          <InputOTP
            id="otp-verification"
            maxLength={6}
            value={otp}
            onChange={setOtp}
            required
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "otp-code-error" : undefined}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:border-zinc-200 *:data-[slot=input-otp-slot]:bg-white *:data-[slot=input-otp-slot]:text-xl dark:*:data-[slot=input-otp-slot]:border-zinc-700 dark:*:data-[slot=input-otp-slot]:bg-zinc-950">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:border-zinc-200 *:data-[slot=input-otp-slot]:bg-white *:data-[slot=input-otp-slot]:text-xl dark:*:data-[slot=input-otp-slot]:border-zinc-700 dark:*:data-[slot=input-otp-slot]:bg-zinc-950">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <FieldDescription>
            <Link
              href="/forgot-password"
              className="underline underline-offset-4 transition-colors hover:text-primary"
            >
              I no longer have access to this email address.
            </Link>
          </FieldDescription>
          </Field>

          {fieldError ? (
            <p id="otp-code-error" className="text-center text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}

          {isSuccess ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Verified</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {resendMessage ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Code sent</AlertTitle>
              <AlertDescription>{resendMessage}</AlertDescription>
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
        </CardContent>

        <CardFooter className="flex-col gap-4 bg-transparent p-0 px-8 pb-8 pt-6">
          <Field className="w-full">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-none hover:bg-teal-600 focus-visible:ring-teal-400/40 dark:bg-teal-600 dark:hover:bg-teal-500"
              disabled={otp.length !== 6 || isPending}
            >
              {isPending ? "Verifying..." : "Verify"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Having trouble signing in?{" "}
              <Link
                href="/forgot-password"
                className="underline underline-offset-4 transition-colors hover:text-teal-700 dark:hover:text-teal-300"
              >
                Reset password
              </Link>
            </div>
          </Field>
        </CardFooter>
      </form>
    </Card>
  );
}
