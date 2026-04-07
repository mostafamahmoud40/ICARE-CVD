"use client";

import { useForgotPassword } from "./useForgotPassword";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordPageContainer() {
  const forgotPasswordProps = useForgotPassword();
  return <ForgotPasswordForm {...forgotPasswordProps} />;
}
