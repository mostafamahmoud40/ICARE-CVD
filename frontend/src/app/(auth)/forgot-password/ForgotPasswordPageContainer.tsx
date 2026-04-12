"use client";

import { useForgotPassword } from "./useForgotPassword";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordPageContainer() {
  const { submit, fieldErrors, isPending } = useForgotPassword();
  return <ForgotPasswordForm submit={submit} fieldErrors={fieldErrors} isPending={isPending} />;
}
