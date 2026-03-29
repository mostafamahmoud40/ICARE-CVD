"use client";

import { useCallback, useState } from "react";
import {
  type RegisterCredentials,
  type RegisterField,
  type RegisterFieldErrors,
  hasRegisterFieldErrors,
  validateRegisterCredentials,
  validateRegisterStep,
} from "../services/credentials";
import type { RegisterPort } from "../services/register.port";
import { useRegisterFlowStore } from "../store/register-flow.store";

export type UseRegisterFormDeps = {
  register: RegisterPort;
};

export type SubmitRegisterOptions = {
  onSuccess?: () => void;
};

const disableValidation = true;

export function useRegisterForm({ register }: UseRegisterFormDeps) {
  const credentials = useRegisterFlowStore((state) => state.credentials);
  const setStoreField = useRegisterFlowStore((state) => state.setField);
  const resetCredentials = useRegisterFlowStore(
    (state) => state.resetCredentials,
  );
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const setField = useCallback(
    <K extends keyof RegisterCredentials>(
      field: K,
      value: RegisterCredentials[K],
    ) => {
      setStoreField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    },
    [setStoreField],
  );

  const validateStep = useCallback(
    (fields: readonly RegisterField[]) => {
      if (disableValidation) {
        setFieldErrors((prev) => {
          const clearedErrors: RegisterFieldErrors = { ...prev };

          for (const field of fields) {
            delete clearedErrors[field];
          }

          return clearedErrors;
        });
        setFormError(null);

        return true;
      }

      const nextErrors = validateRegisterStep(credentials, fields);

      setFieldErrors((prev) => {
        const clearedErrors: RegisterFieldErrors = { ...prev };

        for (const field of fields) {
          delete clearedErrors[field];
        }

        return { ...clearedErrors, ...nextErrors };
      });
      setFormError(null);

      return !hasRegisterFieldErrors(nextErrors);
    },
    [credentials],
  );

  const submit = useCallback(
    async ({ onSuccess }: SubmitRegisterOptions = {}) => {
      if (disableValidation) {
        setFieldErrors({});
      } else {
        const nextErrors = validateRegisterCredentials(credentials);
        setFieldErrors(nextErrors);
        if (hasRegisterFieldErrors(nextErrors)) return false;
      }

      setIsPending(true);
      setFormError(null);

      try {
        const result = await register.register(credentials);
        if (result.ok) {
          resetCredentials();
          setFieldErrors({});
          setFormError(null);
          onSuccess?.();
          return true;
        }

        setFormError(result.message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [credentials, register, resetCredentials],
  );

  return {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    validateStep,
    submit,
  };
}
