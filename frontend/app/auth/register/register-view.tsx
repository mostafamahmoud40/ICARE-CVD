"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "./_components/register-form";
import { useRegisterForm } from "./_hooks/use-register-form";
import { createHttpRegisterService } from "./services/http-register.service";

export function RegisterView() {
  const router = useRouter();
  const register = useMemo(() => createHttpRegisterService(), []);

  const { credentials, fieldErrors, formError, isPending, setField, submit } =
    useRegisterForm({
      register,
      onSuccess: () => router.push("/auth/login"),
    });

  return (
    <RegisterForm
      credentials={credentials}
      fieldErrors={fieldErrors}
      formError={formError}
      isPending={isPending}
      onFieldChange={setField}
      onSubmit={submit}
    />
  );
}
