"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./_components/login-form";
import { useLoginForm } from "./_hooks/use-login-form";
import { createHttpSignInService } from "./services/http-sign-in.service";

/**
 * Composition root for the login route: wires port implementation to the form hook.
 * Replace `createHttpSignInService` or pass a custom port in tests.
 */
export function LoginView() {
  const router = useRouter();
  const signIn = useMemo(() => createHttpSignInService(), []);

  const { credentials, fieldErrors, formError, isPending, setField, submit } =
    useLoginForm({
      signIn,
      onSuccess: () => router.push("/"),
    });

  return (
    <LoginForm
      credentials={credentials}
      fieldErrors={fieldErrors}
      formError={formError}
      isPending={isPending}
      onFieldChange={setField}
      onSubmit={submit}
    />
  );
}
