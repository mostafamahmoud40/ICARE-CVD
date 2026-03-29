"use client";

import { useCallback, useState } from "react";
import {
  type LoginCredentials,
  type LoginFieldErrors,
  hasFieldErrors,
  validateLoginCredentials,
} from "../services/credentials";
import type { SignInPort } from "../services/sign-in.port";

export type UseLoginFormDeps = {
  signIn: SignInPort;
  onSuccess?: () => void;
};

export function useLoginForm({ signIn, onSuccess }: UseLoginFormDeps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const setField = useCallback(
    <K extends keyof LoginCredentials>(field: K, value: LoginCredentials[K]) => {
      setCredentials((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    },
    [],
  );

  const submit = useCallback(async () => {
    const nextErrors = validateLoginCredentials(credentials);
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;

    setIsPending(true);
    setFormError(null);

    try {
      const result = await signIn.signIn(credentials);
      if (result.ok) onSuccess?.();
      else setFormError(result.message);
    } finally {
      setIsPending(false);
    }
  }, [credentials, onSuccess, signIn]);

  return {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    submit,
  };
}
