"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

export type OtpCodeFormProps = {
  submit: (code: string) => void;
  resend: () => void;
  email?: string;
  mode?: string | null;
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
  email,
  mode,
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

  const isResetMode = mode === "reset";
  const isRegisterMode = mode === "register";
  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, "$1***$2")
    : "your email address";

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border-0 bg-white shadow-[0_4px_30px_-4px_rgba(26,83,69,0.15)] backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-10 text-center">
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full"
          style={{ background: "#1A534518" }}
        >
          <KeyRound className="size-7 text-[#1A5345]" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#152A24]">
            {isResetMode
              ? "Enter verification code"
              : isRegisterMode
                ? "Verify your email"
                : "Verify your login"}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {isResetMode
              ? "We sent a 6-digit code to reset your password."
              : isRegisterMode
                ? "We sent a 6-digit code to activate your account."
                : "Enter the verification code we sent to your email address."}{" "}
            {email ? (
              <span className="font-medium text-[#1A5345]">{maskedEmail}</span>
            ) : null}
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-0 pt-6">
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="otp-verification" className="text-sm font-medium text-[#374151]">
                Verification code
              </FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="rounded-lg border-[#E8E6E0] text-xs text-[#1A5345]"
                onClick={() => resend()}
                disabled={isResending || isPending}
              >
                <RefreshCwIcon className="size-3" />
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
              containerClassName="justify-center mt-2"
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:border-gray-200 *:data-[slot=input-otp-slot]:bg-white *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:text-[#152A24]">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-2" />
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:border-gray-200 *:data-[slot=input-otp-slot]:bg-white *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:text-[#152A24]">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {!isResetMode && !isRegisterMode && (
              <FieldDescription>
                <Link
                  href="/auth/forgot-password"
                  className="underline underline-offset-4 transition-colors hover:text-[#1A5345]"
                >
                  I no longer have access to this email address.
                </Link>
              </FieldDescription>
            )}
          </Field>

          {fieldError ? (
            <p id="otp-code-error" className="text-center text-sm text-[#E15C5C]" role="alert">
              {fieldError}
            </p>
          ) : null}

          {isSuccess ? (
            <Alert className="border-[#1A5345]/40 bg-[#1A5345]/10 text-[#1A5345]">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Verified</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {resendMessage ? (
            <Alert className="border-[#1A5345]/40 bg-[#1A5345]/10 text-[#1A5345]">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Code sent</AlertTitle>
              <AlertDescription>{resendMessage}</AlertDescription>
            </Alert>
          ) : null}

          {serverErrorMessage ? (
            <Alert className="border-[#E15C5C]/40 bg-[#E15C5C]/10 text-[#E15C5C]">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="flex-col gap-4 bg-transparent p-0 px-8 pb-8 pt-6">
          <Field className="w-full">
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-[#1A5345] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(26,83,69,0.30)] hover:bg-[#1A5345]/90 focus-visible:ring-[#1A5345]/40"
              disabled={otp.length !== 6 || isPending}
            >
              {isPending ? "Verifying..." : isResetMode ? "Verify & Continue" : "Verify"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              {isResetMode ? (
                <>
                  Wrong email?{" "}
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-[#1A5345] underline underline-offset-4 hover:text-[#1A5345]/80"
                  >
                    Go back
                  </Link>
                </>
              ) : (
                <>
                  Having trouble?{" "}
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-[#1A5345] underline underline-offset-4 hover:text-[#1A5345]/80"
                  >
                    Reset password
                  </Link>
                </>
              )}
            </div>
          </Field>
        </CardFooter>
      </form>
    </Card>
  );
}
