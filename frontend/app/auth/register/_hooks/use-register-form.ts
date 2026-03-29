"use client";

import { useCallback, useState } from "react";
import {
  type RegisterCredentials,
  type RegisterFieldErrors,
  hasRegisterFieldErrors,
  validateRegisterCredentials,
} from "../services/credentials";
import type { RegisterPort } from "../services/register.port";

export type UseRegisterFormDeps = {
  register: RegisterPort;
  onSuccess?: () => void;
};

export function useRegisterForm({ register, onSuccess }: UseRegisterFormDeps) {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    firstName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const setField = useCallback(
    <K extends keyof RegisterCredentials>(
      field: K,
      value: RegisterCredentials[K],
    ) => {
      setCredentials((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    },
    [],
  );

  const submit = useCallback(async () => {
    const nextErrors = validateRegisterCredentials(credentials);
    setFieldErrors(nextErrors);
    if (hasRegisterFieldErrors(nextErrors)) return;

    setIsPending(true);
    setFormError(null);

    try {
      const result = await register.register(credentials);
      if (result.ok) onSuccess?.();
      else setFormError(result.message);
    } finally {
      setIsPending(false);
    }
  }, [credentials, onSuccess, register]);

  return {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    submit,
  };
}
