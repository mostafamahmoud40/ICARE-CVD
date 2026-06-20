"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useResetPassword } from "./useResetPassword";
import { ResetPasswordForm } from "./ResetPasswordForm";

function ResetPasswordPageContainerInner() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("resetToken");
  const resetPasswordProps = useResetPassword(resetToken);
  return <ResetPasswordForm {...resetPasswordProps} />;
}

export function ResetPasswordPageContainer() {
  return (
    <Suspense>
      <ResetPasswordPageContainerInner />
    </Suspense>
  );
}
