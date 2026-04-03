"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";

import { resetPasswordSchema } from "./reset-password.schema";
import type {
  ResetPasswordPayload,
  ResetPasswordResponse,
  ResetPasswordValues,
} from "./reset-password.types";

export function useResetPassword(token: string | null) {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordValues, string>>>(
    {}
  );

  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      apiClient.post<ResetPasswordResponse>("/auth/reset-password", payload).then((res) => res.data),
  });

  const submit = useCallback(
    (values: ResetPasswordValues) => {
      const result = resetPasswordSchema.safeParse(values);
      if (!result.success) {
        const next: Partial<Record<keyof ResetPasswordValues, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (key === "password" || key === "confirmPassword") {
            next[key] = issue.message;
          }
        }
        setFieldErrors(next);
        return;
      }

      if (!token) {
        return;
      }

      setFieldErrors({});
      mutation.mutate({
        token,
        password: result.data.password,
      });
    },
    [mutation, token]
  );

  const serverErrorMessage =
    !token
      ? "Reset link is invalid or missing token."
      : mutation.isError && isAxiosError(mutation.error)
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
    successMessage: mutation.data?.message ?? "Your password has been reset successfully.",
    serverErrorMessage,
  };
}
