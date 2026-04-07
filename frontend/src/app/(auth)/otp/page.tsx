import type { Metadata } from "next";

import { OtpPageContainer } from "./OtpPageContainer";

export const metadata: Metadata = {
  title: "OTP Verification | ICARE-CVD",
  description: "Enter the OTP code to verify your login",
};

export default function OtpPage() {
  return <OtpPageContainer />;
}

