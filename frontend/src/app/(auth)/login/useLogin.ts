"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { setAuthTokens } from "@/lib/auth-tokens";

import { loginSchema } from "./login.schema";
import type { LoginResponse, LoginValues } from "./login.types";

export function useLogin() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginValues, string>>>({});

  const mutation = useMutation({
    mutationFn: (values: LoginValues) =>
      apiClient.post<LoginResponse>("/auth/login", values).then((res) => res.data),
    onSuccess: (data) => {
      setAuthTokens(data);
      router.push("/");
    },
  });

  const submit = useCallback(
    (values: LoginValues) => {
      const result = loginSchema.safeParse(values);
      if (!result.success) {
        const next: Partial<Record<keyof LoginValues, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (key === "email" || key === "password") {
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
    serverErrorMessage,
  };
}
