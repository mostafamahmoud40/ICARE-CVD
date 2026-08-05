"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";

import { otpSchema } from "./otp.schema";
import type { OtpResendResponse, OtpVerificationResponse } from "./otp.types";

export function useOtpVerification() {
  const [fieldError, setFieldError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: (code: string) =>
      apiClient.post<OtpVerificationResponse>("/auth/verify-otp", { code }).then((res) => res.data),
  });

  const resendMutation = useMutation({
    mutationFn: () => apiClient.post<OtpResendResponse>("/auth/resend-otp").then((res) => res.data),
  });

  const submit = useCallback(
    (code: string) => {
      const result = otpSchema.safeParse({ code });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Invalid verification code");
        return;
      }

      setFieldError(null);
      verifyMutation.mutate(result.data.code);
    },
    [verifyMutation]
  );

  const serverErrorMessage =
    verifyMutation.isError && isAxiosError(verifyMutation.error)
      ? (verifyMutation.error.response?.data as { message?: string } | undefined)?.message ??
        verifyMutation.error.message
      : verifyMutation.isError
        ? "Something went wrong. Try again."
        : null;

  return {
    submit,
    resend: resendMutation.mutate,
    fieldError,
    isPending: verifyMutation.isPending,
    isSuccess: verifyMutation.isSuccess,
    successMessage: verifyMutation.data?.message ?? "Code verified successfully.",
    resendMessage: resendMutation.data?.message ?? null,
    isResending: resendMutation.isPending,
    serverErrorMessage,
  };
}
