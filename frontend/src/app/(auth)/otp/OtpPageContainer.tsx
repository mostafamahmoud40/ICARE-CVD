"use client";

import { useOtpVerification } from "./useOtpVerification";
import { OtpCodeForm } from "./OtpCodeForm";

export function OtpPageContainer() {
  const otpProps = useOtpVerification();
  return <OtpCodeForm {...otpProps} />;
}
