"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

import { resetPasswordSchema } from "./reset-password.schema";
import type {
  ResetPasswordResponse,
  ResetPasswordValues,
} from "./reset-password.types";

export function useResetPassword(resetToken: string | null) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordValues, string>>>(
    {}
  );

  const mutation = useMutation({
    mutationFn: (payload: { resetToken: string; password: string }) =>
      apiClient
        .post<ResetPasswordResponse>("/auth/reset-password-with-token", payload)
        .then((res) => res.data),
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

      if (!resetToken) {
        return;
      }

      setFieldErrors({});
      mutation.mutate({
        resetToken,
        password: result.data.password,
      });
    },
    [mutation, resetToken]
  );

  useEffect(() => {
    if (mutation.isSuccess) {
      toast.success("Password updated! You can now log in with your new password.");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }, [mutation.isSuccess, router]);

  const serverErrorMessage = !resetToken
    ? "Reset token is missing. Please restart the password reset process."
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
