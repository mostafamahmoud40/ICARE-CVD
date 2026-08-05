"use client";

import { useState } from "react";
import { KeyRound, RefreshCwIcon } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { apiClient } from "@/lib/api-client";

import type { RegisterResponse } from "./register.types";
import { useRegisterStore } from "./useRegisterStore";
import { otpSchema } from "../otp/otp.schema";

type StepVerifyEmailProps = {
  email: string;
  isPending: boolean;
};

function readApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (err.message) return err.message;
  }
  return fallback;
}

export function StepVerifyEmail({ email, isPending: storePending }: StepVerifyEmailProps) {
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendHint, setResendHint] = useState<string | null>(null);

  const completeEmailVerification = useRegisterStore((s) => s.completeEmailVerification);

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");

  function handleOtpChange(value: string) {
    setOtp(value);
    if (fieldError) setFieldError(null);
    if (serverError) setServerError(null);
  }

  async function handleVerify() {
    const result = otpSchema.safeParse({ code: otp });
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Enter the 6-digit code from your email.";
      setFieldError(message);
      toast.error(message);
      return;
    }

    setFieldError(null);
    setServerError(null);
    setResendHint(null);
    setIsVerifying(true);

    try {
      const { data } = await apiClient.post<RegisterResponse>(
        "/auth/verify-registration-otp",
        { email, code: result.data.code },
      );
      completeEmailVerification(data);
      toast.success("Email verified! Check your inbox for a welcome message.");
    } catch (err: unknown) {
      const message = readApiErrorMessage(
        err,
        "Incorrect verification code. Please try again or resend a new code.",
      );
      setOtp("");
      setServerError(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setFieldError(null);
    setServerError(null);
    setResendHint(null);
    setIsResending(true);

    try {
      const { data } = await apiClient.post<{ message?: string }>(
        "/auth/resend-registration-otp",
        { email },
      );
      const message = data.message ?? "A new verification code has been sent to your email.";
      setOtp("");
      setResendHint(message);
      toast.success(message);
    } catch (err: unknown) {
      const message = readApiErrorMessage(err, "Could not resend the code. Try again.");
      setServerError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }

  const busy = isVerifying || storePending;

  return (
    <div className="space-y-5 rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1A1F1E]">Verify your email</p>
          <p className="text-sm text-[#6B7870]">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[#1A5345]">{maskedEmail}</span>. Enter it below to
            create your account. If the code is wrong, you will see an error and can resend a new
            one.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="register-otp" className="text-sm font-medium text-[#374151]">
              Verification code
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-lg border-[#E8E6E0] text-xs text-[#1A5345]"
              onClick={() => void handleResend()}
              disabled={isResending || busy}
            >
              <RefreshCwIcon className={`size-3 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending..." : "Resend code"}
            </Button>
          </div>

          <InputOTP
            id="register-otp"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            required
            aria-invalid={Boolean(fieldError || serverError)}
            aria-describedby={
              fieldError || serverError ? "register-otp-error" : resendHint ? "register-otp-hint" : undefined
            }
            containerClassName="justify-center mt-3"
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
        </Field>

        {fieldError ? (
          <p id="register-otp-error" className="text-center text-sm text-[#E15C5C]" role="alert">
            {fieldError}
          </p>
        ) : null}

        {serverError ? (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
            <AlertTitle>Incorrect code</AlertTitle>
            <AlertDescription>
              {serverError} You can tap <strong>Resend code</strong> to receive a new one.
            </AlertDescription>
          </Alert>
        ) : null}

        {resendHint ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <AlertTitle id="register-otp-hint">New code sent</AlertTitle>
            <AlertDescription>{resendHint}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          onClick={() => void handleVerify()}
          className="h-12 w-full rounded-xl bg-[#1A5345] text-sm font-semibold text-white hover:bg-[#154434]"
          disabled={otp.length !== 6 || busy}
        >
          {isVerifying ? "Verifying..." : "Verify & create account"}
        </Button>
      </div>
    </div>
  );
}
