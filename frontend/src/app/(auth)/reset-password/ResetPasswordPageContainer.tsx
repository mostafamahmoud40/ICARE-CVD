"use client";

import { useSearchParams } from "next/navigation";

import { useResetPassword } from "./useResetPassword";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordPageContainer() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPasswordProps = useResetPassword(token);
  return <ResetPasswordForm {...resetPasswordProps} />;
}
