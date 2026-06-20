"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

import { forgotPasswordSchema } from "./forgot-password.schema";
import type { ForgotPasswordResponse, ForgotPasswordValues } from "./forgot-password.types";

export function useForgotPassword() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordValues, string>>
  >({});

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", values).then((res) => res.data),
  });

  const submit = useCallback(
    (values: ForgotPasswordValues) => {
      const result = forgotPasswordSchema.safeParse(values);
      if (!result.success) {
        const next: Partial<Record<keyof ForgotPasswordValues, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (key === "email") {
            next[key] = issue.message;
          }
        }
        setFieldErrors(next);
        return;
      }
      setFieldErrors({});
      mutation.mutate(result.data, {
        onSuccess: () => {
          toast.success("OTP sent! Check your email.");
          // Redirect to OTP page with email as a query param
          router.push(`/auth/otp?email=${encodeURIComponent(result.data.email)}&mode=reset`);
        },
      });
    },
    [mutation, router]
  );

  useEffect(() => {
    if (mutation.isError) {
      const msg =
        isAxiosError(mutation.error) && mutation.error.response?.data
          ? (mutation.error.response.data as { message?: string }).message ??
          mutation.error.message
          : "Something went wrong. Try again.";
      toast.error(msg);
    }
  }, [mutation.isError, mutation.error]);

  return {
    submit,
    fieldErrors,
    isPending: mutation.isPending,
  };
}
