"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { useRegisterStore } from "@/app/(auth)/register/useRegisterStore";
import type { RegisterResponse } from "@/app/(auth)/register/register.types";

import { otpSchema } from "./otp.schema";
import type { OtpResendResponse } from "./otp.types";

type VerifyResetOtpResponse = {
  resetToken: string;
  message: string;
};

export function useOtpVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const mode = searchParams.get("mode");

  const [fieldError, setFieldError] = useState<string | null>(null);

  const verifyRegistrationMutation = useMutation({
    mutationFn: ({ email: e, code }: { email: string; code: string }) =>
      apiClient
        .post<RegisterResponse>("/auth/verify-registration-otp", { email: e, code })
        .then((res) => res.data),
  });

  const verifyResetMutation = useMutation({
    mutationFn: ({ email: e, code }: { email: string; code: string }) =>
      apiClient
        .post<VerifyResetOtpResponse>("/auth/verify-reset-otp", { email: e, code })
        .then((res) => res.data),
  });

  const resendMutation = useMutation({
    mutationFn: () => {
      if (mode === "reset" && email) {
        return apiClient
          .post<OtpResendResponse>("/auth/forgot-password", { email })
          .then((res) => res.data);
      }
      if (mode === "register" && email) {
        return apiClient
          .post<OtpResendResponse>("/auth/resend-registration-otp", { email })
          .then((res) => res.data);
      }
      return Promise.resolve({ message: "Unable to resend code." });
    },
  });

  const submit = useCallback(
    (code: string) => {
      const result = otpSchema.safeParse({ code });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Invalid verification code");
        return;
      }

      setFieldError(null);

      if (mode === "reset") {
        verifyResetMutation.mutate(
          { email, code: result.data.code },
          {
            onSuccess: (data) => {
              toast.success("OTP verified!");
              router.push(
                `/auth/reset-password?resetToken=${encodeURIComponent(data.resetToken)}`,
              );
            },
          },
        );
        return;
      }

      if (mode === "register") {
        if (!email) {
          setFieldError("Missing email. Please start registration again.");
          return;
        }

        verifyRegistrationMutation.mutate(
          { email, code: result.data.code },
          {
            onSuccess: (data) => {
              useRegisterStore.getState().completeEmailVerification(data);
              toast.success("Email verified! Continue your registration.");
              router.push("/auth/register/profile");
            },
          },
        );
        return;
      }

      setFieldError("Unknown verification flow. Please try again.");
    },
    [verifyRegistrationMutation, verifyResetMutation, mode, email, router],
  );

  useEffect(() => {
    if (verifyRegistrationMutation.isSuccess) {
      toast.success("Account activated.");
    }
  }, [verifyRegistrationMutation.isSuccess]);

  const activeMutation =
    mode === "reset"
      ? verifyResetMutation
      : mode === "register"
        ? verifyRegistrationMutation
        : verifyRegistrationMutation;

  const serverErrorMessage =
    activeMutation.isError && isAxiosError(activeMutation.error)
      ? (activeMutation.error.response?.data as { message?: string } | undefined)?.message ??
        activeMutation.error.message
      : activeMutation.isError
        ? "Something went wrong. Try again."
        : null;

  return {
    submit,
    resend: resendMutation.mutate,
    email,
    mode,
    fieldError,
    isPending: activeMutation.isPending,
    isSuccess: activeMutation.isSuccess,
    successMessage:
      mode === "reset"
        ? "OTP verified. Redirecting..."
        : mode === "register"
          ? (verifyRegistrationMutation.data?.message ?? "Email verified. Redirecting...")
          : "Code verified successfully.",
    resendMessage: resendMutation.data?.message ?? null,
    isResending: resendMutation.isPending,
    serverErrorMessage,
  };
}
