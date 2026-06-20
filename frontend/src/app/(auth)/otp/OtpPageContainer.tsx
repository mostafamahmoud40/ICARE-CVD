"use client";

import { Suspense } from "react";

import { useOtpVerification } from "./useOtpVerification";
import { OtpCodeForm } from "./OtpCodeForm";

function OtpPageContainerInner() {
  const otpProps = useOtpVerification();
  return <OtpCodeForm {...otpProps} />;
}

export function OtpPageContainer() {
  return (
    <Suspense>
      <OtpPageContainerInner />
    </Suspense>
  );
}
