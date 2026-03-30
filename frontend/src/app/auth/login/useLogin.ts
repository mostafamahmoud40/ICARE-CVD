import { useState } from "react";

type LoginResult = { ok: true } | { ok: false; message: string };

type UseLoginOptions = {
  onSuccess?: () => void;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginFieldErrors = Partial<Record<keyof LoginCredentials, string>>;

export function useLogin({ onSuccess }: UseLoginOptions = {}) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function setField<K extends keyof LoginCredentials>(
    field: K,
    value: LoginCredentials[K],
  ) {
    setCredentials((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError(null);
  }

  async function submit() {
    const nextErrors = validateLoginCredentials(credentials);
    setFieldErrors(nextErrors);

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setIsPending(true);
    setFormError(null);

    try {
      const result = await signIn(credentials);

      if (result.ok) {
        onSuccess?.();
        return;
      }

      setFormError(result.message);
    } finally {
      setIsPending(false);
    }
  }

  return {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    submit,
  };
}

async function signIn(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let message = "Sign in failed";

      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) {
          message = body.message;
        }
      } catch {
        // Ignore malformed error bodies and use the fallback message.
      }

      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the server" };
  }
}

function validateLoginCredentials(
  credentials: LoginCredentials,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!credentials.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (!credentials.password) {
    errors.password = "Password is required";
  } else if (credentials.password.length < 8) {
    errors.password = "Use at least 8 characters";
  }

  return errors;
}

function hasFieldErrors(errors: LoginFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
