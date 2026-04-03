"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";

import { forgotPasswordSchema } from "./forgot-password.schema";
import type { ForgotPasswordResponse, ForgotPasswordValues } from "./forgot-password.types";

export function useForgotPassword() {
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
      mutation.mutate(result.data);
    },
    [mutation]
  );

  const serverErrorMessage =
    mutation.isError && isAxiosError(mutation.error)
      ? (mutation.error.response?.data as { message?: string } | undefined)?.message ??
        mutation.error.message
      : mutation.isError
        ? "Something went wrong. Try again."
        : null;

  return {
    submit,
    fieldErrors,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    successMessage:
      mutation.data?.message ??
      "If this email exists, we sent password reset instructions.",
    serverErrorMessage,
  };
}
