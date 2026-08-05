"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";

import { REGISTER_VALIDATION_ENABLED, registerSchema } from "./register.schema";
import type { RegisterPayload, RegisterResponse, RegisterValues } from "./register.types";

export function useRegister() {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterValues, string>>>(
    {}
  );

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiClient.post<RegisterResponse>("/auth/register", payload).then((res) => res.data),
  });

  const submit = useCallback(
    (values: RegisterValues) => {
      if (!REGISTER_VALIDATION_ENABLED) {
        setFieldErrors({});
        mutation.mutate({
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values.password,
        });
        return;
      }

      const result = registerSchema.safeParse(values);
      if (!result.success) {
        const next: Partial<Record<keyof RegisterValues, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (
            key === "fullName" ||
            key === "email" ||
            key === "phoneNumber" ||
            key === "password" ||
            key === "confirmPassword"
          ) {
            next[key] = issue.message;
          }
        }
        setFieldErrors(next);
        return;
      }

      setFieldErrors({});
      mutation.mutate({
        fullName: result.data.fullName,
        email: result.data.email,
        phoneNumber: result.data.phoneNumber,
        password: result.data.password,
      });
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
      mutation.data?.message ?? "Your account has been created. You can now sign in.",
    serverErrorMessage,
  };
}
